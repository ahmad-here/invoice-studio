import type { BusinessPayment, BusinessProfile, PaymentDetails, UserPreferences } from '@/types/invoice'

export const hasPaymentDetails = (p?: Partial<BusinessPayment> | null) =>
  !!p && !!(p.bankName || p.accountHolder || p.accountNumber || p.iban || p.swift || p.instructions || p.link)

/** Payment details for a new invoice: the business's own, else the global defaults from Settings. */
export function paymentFor(business: BusinessProfile | undefined, prefs: UserPreferences): PaymentDetails {
  const own = business?.payment
  const p: BusinessPayment = hasPaymentDetails(own) ? own! : { ...prefs.payment, instructions: prefs.defaultPaymentInstructions }
  return { ...p, method: p.method || 'Bank transfer', visible: hasPaymentDetails(p) }
}

export const toBusinessPayment = ({ visible: _v, ...rest }: PaymentDetails): BusinessPayment => { void _v; return rest }
