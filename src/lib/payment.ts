import type { BusinessPayment, PaymentDetails, SavedPaymentMethod, UserPreferences } from '@/types/invoice'

export const hasPaymentDetails = (p?: Partial<BusinessPayment> | null) =>
  !!p && !!(p.bankName || p.accountHolder || p.accountNumber || p.iban || p.swift || p.instructions || p.link)

export const emptyPayment = (): BusinessPayment => ({ method: 'Bank transfer', bankName: '', accountHolder: '', accountNumber: '', iban: '', swift: '', instructions: '', link: '' })

export const defaultMethod = (prefs: Pick<UserPreferences, 'paymentMethods' | 'defaultPaymentId'>): SavedPaymentMethod | undefined =>
  prefs.paymentMethods.find((m) => m.id === prefs.defaultPaymentId) ?? prefs.paymentMethods[0]

/** Saved method → invoice payment block. */
export function methodToPayment(m: SavedPaymentMethod): PaymentDetails {
  const { id: _i, label: _l, ...rest } = m
  void _i; void _l
  return { ...rest, visible: true }
}

/** Payment block + selected method id for a new invoice (Settings → Payment methods is the single source). */
export function paymentFor(prefs: UserPreferences): { payment: PaymentDetails; paymentMethodId?: string } {
  const m = defaultMethod(prefs)
  return m ? { payment: methodToPayment(m), paymentMethodId: m.id } : { payment: { ...emptyPayment(), visible: false }, paymentMethodId: undefined }
}

export const toBusinessPayment = ({ visible: _v, ...rest }: PaymentDetails): BusinessPayment => { void _v; return rest }

/** Short summary for lists: "HBL · ****6356". */
export function methodSummary(m: BusinessPayment): string {
  const acct = m.iban || m.accountNumber
  return [m.bankName || m.method, acct ? `•••• ${acct.slice(-4)}` : '', !acct && m.link ? m.link : ''].filter(Boolean).join(' · ')
}
