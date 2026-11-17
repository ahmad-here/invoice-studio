import type { CurrencyCode, Minor } from '@/types/invoice'

export const CURRENCIES: { code: CurrencyCode; name: string; locale: string }[] = [
  { code: 'USD', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', locale: 'en-GB' },
  { code: 'PKR', name: 'Pakistani Rupee', locale: 'en-PK' },
  { code: 'AED', name: 'UAE Dirham', locale: 'en-AE' },
  { code: 'SAR', name: 'Saudi Riyal', locale: 'en-SA' },
  { code: 'INR', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'CAD', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'JPY', name: 'Japanese Yen', locale: 'ja-JP' },
]
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code)
export const isCurrency = (v: string): v is CurrencyCode => (CURRENCY_CODES as string[]).includes(v)

const decimalsCache = new Map<string, number>()
/** Number of minor-unit digits for a currency (2 for USD, 0 for JPY). */
export function currencyDecimals(code: CurrencyCode): number {
  let d = decimalsCache.get(code)
  if (d === undefined) {
    d = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits ?? 2
    decimalsCache.set(code, d)
  }
  return d
}

/** Round half away from zero, guarding against binary float artefacts (e.g. 1.005 * 100). */
export function roundHalf(n: number): number {
  if (!Number.isFinite(n)) return 0
  const a = Math.abs(n)
  const r = Math.round(a + Math.max(1, a) * 1e-12)
  return n < 0 ? -r : r
}

/** Convert a decimal major-unit amount ("12.34" or 12.34) to integer minor units. Returns NaN if invalid. */
export function toMinor(major: number | string, code: CurrencyCode): Minor {
  const d = currencyDecimals(code)
  const s = typeof major === 'number' ? (Number.isFinite(major) ? major.toString() : '') : major.trim()
  if (s === '' || s === '-' || s === '.' || !/^-?\d*(\.\d*)?(e[-+]?\d+)?$/i.test(s)) return NaN
  if (/e/i.test(s)) return roundHalf(Number(s) * 10 ** d)
  // string arithmetic avoids float error: "19.99" -> 1999 exactly
  const neg = s.startsWith('-')
  const [int = '0', frac = ''] = s.replace('-', '').split('.')
  const padded = (frac + '0'.repeat(d + 1)).slice(0, d + 1)
  let value = Number(int || '0') * 10 ** d + Number(padded.slice(0, d) || '0')
  if (Number(padded[d]) >= 5) value += 1
  return neg ? -value : value
}

export function fromMinor(minor: Minor, code: CurrencyCode): number {
  return minor / 10 ** currencyDecimals(code)
}

/** Major-unit string for inputs, e.g. 1999 -> "19.99" */
export function minorToInput(minor: Minor, code: CurrencyCode): string {
  const d = currencyDecimals(code)
  const neg = minor < 0
  const abs = Math.abs(Math.trunc(minor)).toString().padStart(d + 1, '0')
  const out = d === 0 ? abs : `${abs.slice(0, -d)}.${abs.slice(-d)}`
  return neg ? `-${out}` : out
}

/** Re-express minor units when the currency changes decimal places (e.g. USD → JPY). */
export function convertMinorPrecision(minor: Minor, from: CurrencyCode, to: CurrencyCode): Minor {
  const diff = currencyDecimals(to) - currencyDecimals(from)
  return diff === 0 ? minor : roundHalf(minor * 10 ** diff)
}

const fmtCache = new Map<string, Intl.NumberFormat>()
export function formatMoney(minor: Minor, code: CurrencyCode, locale?: string): string {
  const loc = locale || CURRENCIES.find((c) => c.code === code)?.locale || 'en-US'
  const key = `${loc}|${code}`
  let f = fmtCache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(loc, { style: 'currency', currency: code })
    fmtCache.set(key, f)
  }
  return f.format(fromMinor(minor, code))
}

export function formatNumber(n: number, locale = 'en-US', maxFrac = 3): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFrac }).format(n)
}
