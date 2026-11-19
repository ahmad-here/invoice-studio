import { describe, expect, it } from 'vitest'
import { fastInvoice, fastPrefs } from '@/lib/fastMigrate'
import { migrateInvoice, migratePrefs } from '@/lib/schema'
import { createInvoice, defaultPreferences, emptyBusiness } from '@/lib/defaults'
import { sampleInvoice } from '@/lib/sample'
import { shiftDueDate } from '@/lib/dates'
import { storage } from '@/services/storage/db'

describe('fast migration path stays in sync with the zod schema', () => {
  it('accepts app-written records unchanged and agrees with zod', () => {
    for (const inv of [createInvoice(defaultPreferences(), emptyBusiness(), 'INV-1'), sampleInvoice('retail')]) {
      expect(fastInvoice(inv)).toBe(inv)
      expect(migrateInvoice(inv)).toEqual(inv)
    }
    expect(fastPrefs(defaultPreferences())).toEqual(migratePrefs(defaultPreferences()))
  })
  it('rejects malformed or foreign records so zod can repair them', () => {
    expect(fastInvoice({ id: 'x' })).toBeNull()
    expect(fastInvoice({ ...createInvoice(defaultPreferences(), emptyBusiness(), 'A'), items: 'nope' })).toBeNull()
    const svgLogo = createInvoice(defaultPreferences(), { ...emptyBusiness(), logo: { dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=', width: 1, height: 1, size: 1, position: 'left' } }, 'B')
    expect(fastInvoice(svgLogo)).toBeNull()
    expect(migrateInvoice(svgLogo)?.business.logo).toBeUndefined()
  })
})

describe('shiftDueDate', () => {
  it('keeps the original payment window', () => {
    expect(shiftDueDate('2026-01-01', '2026-01-31', '2026-11-17')).toBe('2026-12-17')
    expect(shiftDueDate('2026-01-01', '', '2026-11-17')).toBe('')
    expect(shiftDueDate('', '2026-01-31', '2026-11-17')).toBe('2026-11-17')
    expect(shiftDueDate('2026-02-01', '2026-01-01', '2026-11-17')).toBe('2026-11-17') // negative gap clamps to 0
  })
})

describe('storage (IndexedDB)', () => {
  it('migrates a legacy single business and persists generated ids', async () => {
    await storage.clearAll()
    const first = await storage.getBusinesses()
    expect(first).toEqual([])
    await storage.saveBusinesses([{ ...emptyBusiness(), name: 'No Id Co' }])
    const a = await storage.getBusinesses()
    const b = await storage.getBusinesses()
    expect(a[0].id).toBeTruthy()
    expect(b[0].id).toBe(a[0].id) // id written back, stable across reads
  })
  it('round-trips a backup without duplicating businesses', async () => {
    await storage.clearAll()
    await storage.saveBusinesses([{ ...emptyBusiness(), id: 'b1', name: 'Acme' }])
    await storage.saveInvoice(createInvoice(defaultPreferences(), { ...emptyBusiness(), id: 'b1', name: 'Acme' }, 'INV-9'))
    const backup = await storage.exportBackup()
    await storage.importBackup(backup)
    await storage.importBackup(backup)
    expect(await storage.getBusinesses()).toHaveLength(1)
    expect(await storage.listInvoices()).toHaveLength(1)
    await expect(storage.importBackup({ hello: 'world' })).rejects.toThrow(/not an Invoice Studio backup/)
  })
  it('keeps drafts per invoice', async () => {
    const a = createInvoice(defaultPreferences(), emptyBusiness(), 'A')
    const n = createInvoice(defaultPreferences(), emptyBusiness(), 'N')
    await storage.saveEditorDraft(a.id, a)
    await storage.saveEditorDraft('new', n)
    expect((await storage.getEditorDraft(a.id))?.number).toBe('A')
    expect((await storage.getEditorDraft('new'))?.number).toBe('N')
  })
})

describe('payment methods migration', () => {
  it('turns legacy single payment details into the default saved method', () => {
    const legacy = { ...defaultPreferences(), paymentMethods: undefined, payment: { method: 'Bank transfer', bankName: 'Habib Bank Limited', accountHolder: 'Ahmad', accountNumber: '345346356356', iban: '', swift: '', link: '' } }
    const p = migratePrefs(legacy)
    expect(p.paymentMethods).toHaveLength(1)
    expect(p.paymentMethods[0]).toMatchObject({ label: 'Habib Bank Limited', accountNumber: '345346356356' })
    expect(p.defaultPaymentId).toBe(p.paymentMethods[0].id)
    const inv = createInvoice(p, emptyBusiness(), 'X')
    expect(inv.payment).toMatchObject({ bankName: 'Habib Bank Limited', visible: true })
    expect(inv.paymentMethodId).toBe(p.defaultPaymentId)
  })
})
