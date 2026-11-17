import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { BusinessProfile, Invoice, UserPreferences } from '@/types/invoice'
import { SCHEMA_VERSION } from '@/types/invoice'
import { migrateBusiness, migrateInvoice, migratePrefs, type BackupFile } from '@/lib/schema'
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
    return all.reverse().map((r) => migrateInvoice(r)).filter((x): x is Invoice => !!x)
  },
  async getInvoice(id: string): Promise<Invoice | null> {
    return migrateInvoice(await (await db()).get('invoices', id))
  },
  async saveInvoice(inv: Invoice): Promise<void> {
    await (await db()).put('invoices', { ...inv, updatedAt: Date.now() })
  },
  async saveInvoices(list: Invoice[]): Promise<void> {
    const tx = (await db()).transaction('invoices', 'readwrite')
    await Promise.all([...list.map((i) => tx.store.put(i)), tx.done])
  },
  async deleteInvoice(id: string): Promise<void> {
    await (await db()).delete('invoices', id)
  },
  async numberExists(number: string, exceptId?: string): Promise<boolean> {
    const all = await (await db()).getAll('invoices')
    return all.some((i) => i.number === number && i.id !== exceptId)
  },
  async getPrefs(): Promise<UserPreferences> {
    return migratePrefs(await (await db()).get('kv', 'prefs'))
  },
  async savePrefs(p: UserPreferences): Promise<void> {
    await (await db()).put('kv', p, 'prefs')
  },
  /** All business profiles. Migrates the single legacy 'business' record on first read. */
  async getBusinesses(): Promise<BusinessProfile[]> {
    const d = await db()
    const list = await d.get('kv', 'businesses')
    if (Array.isArray(list)) return list.map((b) => ({ ...migrateBusiness(b), id: (b as BusinessProfile).id || uid() }))
    const legacy = await d.get('kv', 'business')
    const migrated = legacy ? [{ ...migrateBusiness(legacy), id: uid() }] : []
    if (migrated.length) await d.put('kv', migrated, 'businesses')
    return migrated
  },
  async saveBusinesses(list: BusinessProfile[]): Promise<void> {
    await (await db()).put('kv', list, 'businesses')
  },
  async getEditorDraft(): Promise<Invoice | null> {
    return migrateInvoice(await (await db()).get('kv', 'editorDraft'))
  },
  async saveEditorDraft(inv: Invoice | null): Promise<void> {
    const d = await db()
    if (inv) await d.put('kv', inv, 'editorDraft')
    else await d.delete('kv', 'editorDraft')
  },
  async exportBackup(): Promise<BackupFile> {
    return {
      app: 'invoice-studio',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      preferences: await this.getPrefs(),
      business: (await this.getBusinesses())[0] ?? emptyBusiness(),
      businesses: await this.getBusinesses(),
      invoices: await this.listInvoices(),
    }
  },
  /** Merges invoices by id (imported wins). Returns counts. */
  async importBackup(raw: unknown): Promise<{ imported: number; skipped: number }> {
    if (!raw || typeof raw !== 'object' || (raw as BackupFile).app !== 'invoice-studio') {
      throw new Error('This file is not an Invoice Studio backup.')
    }
    const b = raw as Partial<BackupFile>
    if (typeof b.schemaVersion === 'number' && b.schemaVersion > SCHEMA_VERSION) {
      throw new Error('This backup was created by a newer version of the app. Please update first.')
    }
    const list = Array.isArray(b.invoices) ? b.invoices : []
    const valid = list.map(migrateInvoice).filter((x): x is Invoice => !!x)
    if (b.preferences) await this.savePrefs(migratePrefs(b.preferences))
    if (Array.isArray(b.businesses) && b.businesses.length) {
      const existing = await this.getBusinesses()
      const incoming = b.businesses.map((x) => ({ ...migrateBusiness(x), id: (x as BusinessProfile).id || uid() }))
      const ids = new Set(incoming.map((x) => x.id))
      await this.saveBusinesses([...existing.filter((x) => !ids.has(x.id ?? "")), ...incoming])
    } else if (b.business && migrateBusiness(b.business).name) {
      const existing = await this.getBusinesses()
      await this.saveBusinesses([...existing, { ...migrateBusiness(b.business), id: uid() }])
    }
    await this.saveInvoices(valid)
    return { imported: valid.length, skipped: list.length - valid.length }
  },
  async clearAll(): Promise<void> {
    const d = await db()
    await d.clear('invoices')
    await d.clear('kv')
  },
}
