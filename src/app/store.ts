import { create } from 'zustand'
import type { BusinessProfile, Invoice, UserPreferences } from '@/types/invoice'
import { defaultPreferences, emptyBusiness, formatInvoiceNumber } from '@/lib/defaults'
import { storage } from '@/services/storage/db'
import { uid } from '@/lib/sanitize'

const pickDefault = (list: BusinessProfile[], id?: string): BusinessProfile => list.find((b) => b.id === id) ?? list[0] ?? emptyBusiness()

interface AppState {
  loaded: boolean
  error: string | null
  prefs: UserPreferences
  /** the default business profile (used for new invoices) */
  business: BusinessProfile
  businesses: BusinessProfile[]
  invoices: Invoice[]
  init: () => Promise<void>
  reload: () => Promise<void>
  saveInvoice: (inv: Invoice) => Promise<void>
  saveMany: (list: Invoice[]) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  savePrefs: (p: UserPreferences) => Promise<void>
  /** insert or update a profile; returns it with an id */
  saveBusiness: (b: BusinessProfile, makeDefault?: boolean) => Promise<BusinessProfile>
  deleteBusiness: (id: string) => Promise<void>
  setDefaultBusiness: (id: string) => Promise<void>
  /** Reserve the next default invoice number (only advances when the number was used). */
  nextNumber: () => string
}

/** Pull trailing digits off a number like "INV-0042" so the counter can follow manual edits. */
const trailing = (s: string, prefix: string) => {
  if (!s.startsWith(prefix)) return 0
  const m = /(\d+)$/.exec(s.slice(prefix.length))
  return m ? Number(m[1]) : 0
}

export const useApp = create<AppState>((set, get) => ({
  loaded: false,
  error: null,
  prefs: defaultPreferences(),
  business: emptyBusiness(),
  businesses: [],
  invoices: [],
  async init() {
    if (get().loaded) return
    try {
      const [prefs, businesses, invoices] = await Promise.all([storage.getPrefs(), storage.getBusinesses(), storage.listInvoices()])
      set({ prefs, businesses, business: pickDefault(businesses, prefs.defaultBusinessId), invoices, loaded: true })
    } catch (e) {
      set({ loaded: true, error: `Local storage is unavailable: ${(e as Error).message}. Your work cannot be saved in this browser mode (e.g. private browsing).` })
    }
  },
  async reload() {
    const [prefs, businesses, invoices] = await Promise.all([storage.getPrefs(), storage.getBusinesses(), storage.listInvoices()])
    set({ prefs, businesses, business: pickDefault(businesses, prefs.defaultBusinessId), invoices })
  },
  async saveInvoice(inv) {
    const saved = { ...inv, updatedAt: Date.now() }
    await storage.saveInvoice(saved)
    const { prefs } = get()
    const n = trailing(inv.number, prefs.numberPrefix)
    if (n >= prefs.nextNumber) await get().savePrefs({ ...prefs, nextNumber: n + 1 })
    set((s) => ({ invoices: [saved, ...s.invoices.filter((i) => i.id !== inv.id)] }))
  },
  async saveMany(list) {
    const now = Date.now()
    const stamped = list.map((i, k) => ({ ...i, updatedAt: now + k }))
    await storage.saveInvoices(stamped)
    const ids = new Set(stamped.map((i) => i.id))
    set((s) => ({ invoices: [...stamped.reverse(), ...s.invoices.filter((i) => !ids.has(i.id))] }))
  },
  async deleteInvoice(id) {
    await storage.deleteInvoice(id)
    set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }))
  },
  async savePrefs(p) {
    await storage.savePrefs(p)
    set((s) => ({ prefs: p, business: pickDefault(s.businesses, p.defaultBusinessId) }))
  },
  async saveBusiness(b, makeDefault) {
    const profile = { ...b, id: b.id || uid() }
    const { businesses, prefs } = get()
    const list = businesses.some((x) => x.id === profile.id) ? businesses.map((x) => (x.id === profile.id ? profile : x)) : [...businesses, profile]
    await storage.saveBusinesses(list)
    const defId = makeDefault || list.length === 1 || !prefs.defaultBusinessId ? profile.id : prefs.defaultBusinessId
    if (defId !== prefs.defaultBusinessId) await storage.savePrefs({ ...prefs, defaultBusinessId: defId })
    set({ businesses: list, prefs: { ...prefs, defaultBusinessId: defId }, business: pickDefault(list, defId) })
    return profile
  },
  async deleteBusiness(id) {
    const { businesses, prefs } = get()
    const list = businesses.filter((x) => x.id !== id)
    await storage.saveBusinesses(list)
    const defId = prefs.defaultBusinessId === id ? list[0]?.id : prefs.defaultBusinessId
    if (defId !== prefs.defaultBusinessId) await storage.savePrefs({ ...prefs, defaultBusinessId: defId })
    set({ businesses: list, prefs: { ...prefs, defaultBusinessId: defId }, business: pickDefault(list, defId) })
  },
  async setDefaultBusiness(id) {
    const { prefs, businesses } = get()
    const p = { ...prefs, defaultBusinessId: id }
    await storage.savePrefs(p)
    set({ prefs: p, business: pickDefault(businesses, id) })
  },
  nextNumber() {
    const { prefs, invoices } = get()
    let n = prefs.nextNumber
    const used = new Set(invoices.map((i) => i.number))
    while (used.has(formatInvoiceNumber(prefs.numberPrefix, n))) n++
    return formatInvoiceNumber(prefs.numberPrefix, n)
  },
}))

/* --------------------------------- toasts --------------------------------- */
export interface Toast { id: number; kind: 'success' | 'error' | 'info'; text: string }
interface ToastState { toasts: Toast[]; push: (kind: Toast['kind'], text: string) => void; dismiss: (id: number) => void }
let tid = 0
export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push(kind, text) {
    const id = ++tid
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, text }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'error' ? 7000 : 3500)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
export const toast = {
  success: (t: string) => useToasts.getState().push('success', t),
  error: (t: string) => useToasts.getState().push('error', t),
  info: (t: string) => useToasts.getState().push('info', t),
}
