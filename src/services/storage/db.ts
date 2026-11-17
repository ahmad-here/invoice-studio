import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BusinessProfile, Invoice, UserPreferences } from '@/types/invoice'
import { SCHEMA_VERSION } from '@/types/invoice'
import type { BackupFile } from '@/lib/schema'
import { fastInvoice, fastPrefs, fastBusiness } from '@/lib/fastMigrate'
import { emptyBusiness } from '@/lib/defaults'
import { uid } from '@/lib/sanitize'

interface StudioDB extends DBSchema {
  invoices: { key: string; value: Invoice; indexes: { updatedAt: number } }
  kv: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null
function db() {
  dbPromise ??= openDB<StudioDB>('invoice-studio', 1, {
    upgrade(d) {
      const s = d.createObjectStore('invoices', { keyPath: 'id' })
      s.createIndex('updatedAt', 'updatedAt')
      d.createObjectStore('kv')
    },
  })
  return dbPromise
}

export const storage = {
  async listInvoices(): Promise<Invoice[]> {
    const all = await (await db()).getAllFromIndex('invoices', 'updatedAt')
    const out: Invoice[] = []
    let slow: ((r: unknown) => Invoice | null) | null = null
    for (const r of all.reverse()) {
      const ok = fastInvoice(r)
      if (ok) { out.push(ok); continue }
      slow ??= (await import('@/lib/schema')).migrateInvoice
      const m = slow(r)
      if (m) out.push(m)
    }
    return out
  },
  async getInvoice(id: string): Promise<Invoice | null> {
    const r = await (await db()).get('invoices', id)
    return fastInvoice(r) ?? (r ? (await import('@/lib/schema')).migrateInvoice(r) : null)
  },
  /** Persists exactly what it is given; the store owns updatedAt. */
  async saveInvoice(inv: Invoice): Promise<void> {
    await (await db()).put('invoices', inv)
  },
  async saveInvoices(list: Invoice[]): Promise<void> {
    const tx = (await db()).transaction('invoices', 'readwrite')
    await Promise.all([...list.map((i) => tx.store.put(i)), tx.done])
  },
  async deleteInvoice(id: string): Promise<void> {
    await (await db()).delete('invoices', id)
  },
  async getPrefs(): Promise<UserPreferences> {
    const r = await (await db()).get('kv', 'prefs')
    return fastPrefs(r) ?? (await import('@/lib/schema')).migratePrefs(r)
  },
  async savePrefs(p: UserPreferences): Promise<void> {
    await (await db()).put('kv', p, 'prefs')
  },
  /** All business profiles. Migrates the single legacy 'business' record on first read. */
  async getBusinesses(): Promise<BusinessProfile[]> {
    const d = await db()
    const list = await d.get('kv', 'businesses')
    const migrateBusiness = async (b: unknown) => fastBusiness(b) ?? (await import('@/lib/schema')).migrateBusiness(b)
    if (Array.isArray(list)) {
      const fixed = await Promise.all(list.map(async (b) => ({ ...(await migrateBusiness(b)), id: (b as BusinessProfile).id || uid() })))
      if (fixed.some((b, i) => b.id !== (list[i] as BusinessProfile)?.id)) await d.put('kv', fixed, 'businesses')
      return fixed
    }
    const legacy = await d.get('kv', 'business')
    const migrated = legacy ? [{ ...(await migrateBusiness(legacy)), id: uid() }] : []
    if (migrated.length) await d.put('kv', migrated, 'businesses')
    return migrated
  },
  async saveBusinesses(list: BusinessProfile[]): Promise<void> {
    await (await db()).put('kv', list, 'businesses')
  },
  /** Unsaved editor work, one slot per invoice (`new` for an unsaved new invoice). */
  async getEditorDraft(key: string): Promise<Invoice | null> {
    const r = await (await db()).get('kv', `editorDraft:${key}`)
    return fastInvoice(r) ?? (r ? (await import('@/lib/schema')).migrateInvoice(r) : null)
  },
  async saveEditorDraft(key: string, inv: Invoice | null): Promise<void> {
    const d = await db()
    if (inv) await d.put('kv', inv, `editorDraft:${key}`)
    else await d.delete('kv', `editorDraft:${key}`)
  },
  async exportBackup(): Promise<BackupFile> {
    const businesses = await this.getBusinesses()
    return {
      app: 'invoice-studio',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      preferences: await this.getPrefs(),
      business: businesses[0] ?? emptyBusiness(),
      businesses,
      invoices: await this.listInvoices(),
    }
  },
  /** Merges invoices by id (imported wins). Returns counts. */
  async importBackup(raw: unknown): Promise<{ imported: number; skipped: number }> {
    const { migrateBusiness, migrateInvoice, migratePrefs } = await import('@/lib/schema')
    if (!raw || typeof raw !== 'object' || (raw as BackupFile).app !== 'invoice-studio') {
      throw new Error('This file is not an Invoice Studio backup.')
    }
    const b = raw as Partial<BackupFile>
    if (typeof b.schemaVersion === 'number' && b.schemaVersion > SCHEMA_VERSION) {
      throw new Error('This backup was created by a newer version of the app. Please update first.')
    }
    const list = Array.isArray(b.invoices) ? b.invoices : []
    const valid = list.map(migrateInvoice).filter((x): x is Invoice => !!x)
    const localPrefs = await this.getPrefs()
    if (Array.isArray(b.businesses) && b.businesses.length) {
      const existing = await this.getBusinesses()
      const incoming = b.businesses.map((x) => ({ ...migrateBusiness(x), id: (x as BusinessProfile).id || uid() }))
      const ids = new Set(incoming.map((x) => x.id))
      await this.saveBusinesses([...existing.filter((x) => !ids.has(x.id ?? "")), ...incoming])
    } else if (b.business && migrateBusiness(b.business).name) {
      const existing = await this.getBusinesses()
      const legacy = migrateBusiness(b.business)
      const same = (x: BusinessProfile) => x.name === legacy.name && x.email === legacy.email && x.taxNumber === legacy.taxNumber
      if (!existing.some(same)) await this.saveBusinesses([...existing, { ...legacy, id: uid() }])
    }
    // Preferences: imported values win, but the default business must point at a real profile
    const finalList = await this.getBusinesses()
    const prefs = b.preferences ? migratePrefs(b.preferences) : localPrefs
    if (!finalList.some((x) => x.id === prefs.defaultBusinessId)) prefs.defaultBusinessId = finalList.some((x) => x.id === localPrefs.defaultBusinessId) ? localPrefs.defaultBusinessId : finalList[0]?.id
    await this.savePrefs(prefs)
    await this.saveInvoices(valid)
    return { imported: valid.length, skipped: list.length - valid.length }
  },
  async clearAll(): Promise<void> {
    const d = await db()
    await d.clear('invoices')
    await d.clear('kv')
  },
}
