import { useEffect, useState, type InputHTMLAttributes } from 'react'
import type { CurrencyCode, Minor } from '@/types/invoice'
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
