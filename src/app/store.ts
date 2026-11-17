import { create } from 'zustand'
import type { BusinessProfile, Invoice, UserPreferences } from '@/types/invoice'
import { defaultPreferences, emptyBusiness, formatInvoiceNumber } from '@/lib/defaults'
import { storage } from '@/services/storage/db'

interface AppState {
  loaded: boolean
  error: string | null
  prefs: UserPreferences
  business: BusinessProfile
  invoices: Invoice[]
  init: () => Promise<void>
  reload: () => Promise<void>
  saveInvoice: (inv: Invoice) => Promise<void>
  saveMany: (list: Invoice[]) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  savePrefs: (p: UserPreferences) => Promise<void>
  saveBusiness: (b: BusinessProfile) => Promise<void>
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
  invoices: [],
  async init() {
    if (get().loaded) return
    try {
      const [prefs, business, invoices] = await Promise.all([storage.getPrefs(), storage.getBusiness(), storage.listInvoices()])
      set({ prefs, business, invoices, loaded: true })
    } catch (e) {
      set({ loaded: true, error: `Local storage is unavailable: ${(e as Error).message}. Your work cannot be saved in this browser mode (e.g. private browsing).` })
    }
  },
  async reload() {
    const [prefs, business, invoices] = await Promise.all([storage.getPrefs(), storage.getBusiness(), storage.listInvoices()])
    set({ prefs, business, invoices })
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
    set({ prefs: p })
  },
  async saveBusiness(b) {
    await storage.saveBusiness(b)
    set({ business: b })
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
