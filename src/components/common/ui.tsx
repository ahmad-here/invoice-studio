import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useToasts } from '@/app/store'

export const cx = (...c: unknown[]) => c.filter((x) => typeof x === 'string' && x).join(' ')

/* --------------------------------- Button --------------------------------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
type Size = 'sm' | 'md' | 'lg' | 'icon'
const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-xs',
  secondary: 'bg-white text-ink border border-line-strong hover:bg-canvas active:bg-line shadow-xs',
  ghost: 'text-muted hover:text-ink hover:bg-canvas',
  danger: 'bg-danger text-white hover:bg-danger-700 shadow-xs',
  'danger-ghost': 'text-muted hover:text-danger hover:bg-danger-50',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 sm:h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
  icon: 'h-9 w-9 rounded-lg justify-center',
}
/** Classes for a link that should look like a button (avoids <a><button/></a>). */
export const buttonClass = ({ variant = 'secondary', size = 'md' }: { variant?: Variant; size?: Size } = {}) =>
  cx('inline-flex items-center font-medium whitespace-nowrap transition-colors select-none', variants[variant], sizes[size])

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cx('inline-flex items-center font-medium whitespace-nowrap transition-colors disabled:opacity-50 select-none', variants[variant], sizes[size], className)} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

/* --------------------------------- Fields --------------------------------- */
const control = 'w-full rounded-lg border border-line-strong bg-white px-3 text-sm text-ink placeholder:text-subtle shadow-xs transition-colors hover:border-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 disabled:bg-canvas disabled:text-muted aria-invalid:border-danger aria-invalid:ring-danger/15'

interface FieldWrap { label?: ReactNode; hint?: ReactNode; error?: string | null; className?: string; required?: boolean; srOnlyLabel?: boolean }

function Wrap({ id, label, hint, error, className, required, srOnlyLabel, children }: FieldWrap & { id: string; children: ReactNode }) {
  return (
    <div className={cx('min-w-0', className)}>
      {label && <label htmlFor={id} className={cx('mb-1.5 block text-[13px] font-medium text-ink', srOnlyLabel && 'sr-only')}>{label}{required && <span className="text-danger" aria-hidden> *</span>}</label>}
      {children}
      {error ? <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p> : hint ? <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & FieldWrap & { suffix?: ReactNode; prefix?: ReactNode }>(function Input({ label, hint, error, className, required, srOnlyLabel, suffix, prefix, id, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} className={className} required={required} srOnlyLabel={srOnlyLabel}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
        <input ref={ref} id={fid} aria-invalid={!!error || undefined} aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined} required={required} className={cx(control, 'h-10', prefix && 'pl-8', suffix && 'pr-9')} {...rest} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>}
      </div>
    </Wrap>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrap>(function Textarea({ label, hint, error, className, required, srOnlyLabel, id, rows = 3, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} className={className} required={required} srOnlyLabel={srOnlyLabel}>
      <textarea ref={ref} id={fid} rows={rows} aria-invalid={!!error || undefined} className={cx(control, 'py-2 leading-relaxed resize-y min-h-[40px]')} {...rest} />
    </Wrap>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldWrap>(function Select({ label, hint, error, className, required, srOnlyLabel, id, children, ...rest }, ref) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <Wrap id={fid} label={label} hint={hint} error={error} className={className} required={required} srOnlyLabel={srOnlyLabel}>
      <select ref={ref} id={fid} className={cx(control, 'h-10 pr-8 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%236B7280%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat')} {...rest}>
        {children}
      </select>
    </Wrap>
  )
})

export function Switch({ checked, onChange, label, description, className, id }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; className?: string; id?: string }) {
  const auto = useId()
  const fid = id ?? auto
  return (
    <div className={cx('flex items-start justify-between gap-3', className)}>
      <label htmlFor={fid} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </label>
      <button id={fid} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cx('relative mt-0.5 inline-flex h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line-strong')}>
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}

/** Segmented control (radio group). */
export function Segmented<T extends string>({ value, onChange, options, label, className, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[]; label: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex rounded-lg bg-canvas p-0.5 border border-line', className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} title={o.title} onClick={() => onChange(o.value)}
          className={cx('rounded-md font-medium transition-colors inline-flex items-center justify-center gap-1', size === 'sm' ? 'h-9 sm:h-7 px-2.5 text-xs' : 'h-10 sm:h-8 px-3 text-[13px]', value === o.value ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------ Layout bits ------------------------------ */
export const Card = ({ className, children }: { className?: string; children: ReactNode }) => <div className={cx('rounded-xl border border-line bg-white shadow-xs', className)}>{children}</div>

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">{icon}</div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'blue' | 'green' | 'red' | 'amber'; children: ReactNode }) {
  const t = { neutral: 'bg-canvas text-muted border-line', blue: 'bg-primary-50 text-primary-700 border-primary-100', green: 'bg-success-50 text-success border-[#bbf7d0]', red: 'bg-danger-50 text-danger border-[#f5c2c7]', amber: 'bg-warning-50 text-warning border-[#fde68a]' }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap', t)}>{children}</span>
}

/* --------------------------------- Modal --------------------------------- */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
      }
    }
    document.addEventListener('keydown', onKey)
    const o = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.querySelector<HTMLElement>('[data-autofocus],input,select,textarea,button:not([aria-label="Close"])')?.focus(), 0)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = o; prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-6xl' }[size]
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title" className={cx('flex max-h-[92vh] w-full flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-xl', w)}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-ink">{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X className="size-5" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel, loading }: { open: boolean; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" footer={<>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>{confirmLabel}</Button>
    </>}>
      <div className="text-sm text-muted">{message}</div>
    </Modal>
  )
}

/* --------------------------------- Toasts --------------------------------- */
export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(8rem+env(safe-area-inset-bottom))] lg:bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-lg">
          {t.kind === 'success' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : t.kind === 'error' ? <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" /> : <Info className="mt-0.5 size-5 shrink-0 text-primary" />}
          <p className="min-w-0 flex-1 text-sm text-ink">{t.text}</p>
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="flex size-8 items-center justify-center rounded-md text-muted hover:text-ink"><X className="size-4" /></button>
        </div>
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted"><Loader2 className="size-5 animate-spin" />{label}…</div>
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const p = max ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-muted"><span>{label}</span><span className="tabular">{value} / {max}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}
