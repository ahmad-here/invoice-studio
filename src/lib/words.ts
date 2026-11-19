import type { CurrencyCode, Minor } from '@/types/invoice'
import { currencyDecimals } from './money'

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES = ['', 'thousand', 'million', 'billion', 'trillion']

function below1000(n: number): string {
  const h = Math.floor(n / 100), r = n % 100
  const parts: string[] = []
  if (h) parts.push(`${ONES[h]} hundred`)
  if (r) parts.push(r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? `-${ONES[r % 10]}` : ''))
  return parts.join(' and ')
}

/** 1234 → "one thousand two hundred and thirty-four" (integers up to trillions). */
export function integerToWords(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'zero'
  const out: string[] = []
  for (let i = 0; n > 0 && i < SCALES.length; i++, n = Math.floor(n / 1000)) {
    const chunk = n % 1000
    if (chunk) out.unshift(below1000(chunk) + (SCALES[i] ? ` ${SCALES[i]}` : ''))
  }
  return out.join(' ')
}

const NAMES: Record<CurrencyCode, [string, string]> = {
  USD: ['US dollars', 'cents'], EUR: ['euros', 'cents'], GBP: ['pounds sterling', 'pence'], PKR: ['Pakistani rupees', 'paisa'],
  AED: ['UAE dirhams', 'fils'], SAR: ['Saudi riyals', 'halalas'], INR: ['Indian rupees', 'paise'], CAD: ['Canadian dollars', 'cents'],
  AUD: ['Australian dollars', 'cents'], JPY: ['Japanese yen', ''],
}

/** Amount in words for tax invoices, e.g. "One thousand two hundred US dollars and fifty cents only". */
export function amountInWords(minor: Minor, currency: CurrencyCode): string {
  const d = currencyDecimals(currency)
  const abs = Math.abs(Math.round(minor))
  const major = Math.floor(abs / 10 ** d)
  const frac = d ? abs % 10 ** d : 0
  const [maj, min] = NAMES[currency] ?? [currency, '']
  let s = `${integerToWords(major)} ${maj}`
  if (frac && min) s += ` and ${integerToWords(frac)} ${min}`
  s = (minor < 0 ? 'minus ' : '') + s + ' only'
  return s.charAt(0).toUpperCase() + s.slice(1)
}
