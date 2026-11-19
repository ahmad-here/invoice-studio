import { useEffect, useId, useState, type InputHTMLAttributes } from 'react'
import type { CurrencyCode, Discount, Minor } from '@/types/invoice'
import { Input } from '@/components/common/ui'
import { minorToInput, normalizeDecimal, toMinor } from '@/lib/money'

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'prefix'> & { label?: string; hint?: string; srOnlyLabel?: boolean; className?: string; suffix?: string; prefix?: string }

/**
 * Money input. Edits a free-form decimal string; commits integer minor units on every valid change
 * so the preview updates live, and normalises the text on blur.
 */
export function MoneyInput({ value, onChange, currency, allowNegative = false, ...rest }: Base & { value: Minor; onChange: (v: Minor) => void; currency: CurrencyCode; allowNegative?: boolean }) {
  const [text, setText] = useState(() => (value ? minorToInput(value, currency) : ''))
  const [focused, setFocused] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { if (!focused) setText(value ? minorToInput(value, currency) : '') }, [value, currency, focused])
  return (
    <Input
      {...rest}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      error={err}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setErr(null) }}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.,\s'-]/g, '')
        setText(raw)
        const t = normalizeDecimal(raw)
        if (t === '' || t === '-' || t === '.') { onChange(0); setErr(null); return }
        const m = toMinor(t, currency)
        if (Number.isNaN(m)) setErr('Enter a valid amount')
        else if (!allowNegative && m < 0) setErr('Amount cannot be negative')
        else if (Math.abs(m) > 1e15) setErr('Amount is too large')
        else { setErr(null); onChange(m) }
      }}
    />
  )
}

/** Plain decimal number input (quantities, percentages). */
export function NumberInput({ value, onChange, min = 0, max, decimals = 4, ...rest }: Base & { value: number; onChange: (v: number) => void; min?: number; max?: number; decimals?: number }) {
  const [text, setText] = useState(() => String(value ?? ''))
  const [focused, setFocused] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { if (!focused) setText(Number.isFinite(value) ? String(value) : '') }, [value, focused])
  return (
    <Input
      {...rest}
      inputMode="decimal"
      autoComplete="off"
      value={text}
      error={err}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); setErr(null) }}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.,\s'-]/g, '')
        setText(raw)
        const t = normalizeDecimal(raw)
        if (t === '' || t === '.' || t === '-') { onChange(0); setErr(null); return }
        const n = Number(t)
        if (!Number.isFinite(n)) setErr('Enter a number')
        else if (n < min) setErr(`Minimum is ${min}`)
        else if (max !== undefined && n > max) setErr(`Maximum is ${max}`)
        else { setErr(null); onChange(Number(n.toFixed(decimals))) }
      }}
    />
  )
}

/**
 * Discount value + type in one aligned control: the %/currency selector is attached to the input's
 * right edge, so the field has the same label row and height as its neighbours.
 */
export function DiscountField({ label, value, onChange, currency, hint, className }: { label: string; value: Discount; onChange: (d: Discount) => void; currency: CurrencyCode; hint?: string; className?: string }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
      <div className="flex">
        <div className="min-w-0 flex-1 [&_input]:rounded-r-none">
          {value.type === 'percent'
            ? <NumberInput id={id} label={label} srOnlyLabel value={value.value} max={100} onChange={(v) => onChange({ type: 'percent', value: v })} />
            : <MoneyInput id={id} label={label} srOnlyLabel value={value.value} currency={currency} onChange={(v) => onChange({ type: 'fixed', value: v })} />}
        </div>
        <select aria-label={`${label} type`} value={value.type} onChange={(e) => onChange({ type: e.target.value as Discount['type'], value: 0 })}
          className="-ml-px h-10 w-16 shrink-0 cursor-pointer rounded-r-lg border border-line-strong bg-canvas px-2 text-sm font-medium text-ink focus:z-10 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15">
          <option value="percent">%</option>
          <option value="fixed">{currency}</option>
        </select>
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
