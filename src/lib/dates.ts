import type { DateFormat } from '@/types/invoice'

const z = (n: number) => String(n).padStart(2, '0')

export const todayISO = (d = new Date()): string => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`

/** Strict yyyy-mm-dd parse that rejects impossible dates such as 2026-02-30. */
export function parseISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? '').trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso) ?? new Date()
  d.setDate(d.getDate() + days)
  return todayISO(d)
}

/** Accepts yyyy-mm-dd, yyyy/mm/dd and dd/mm/yyyy (day-first). Returns ISO or null. */
export function normalizeDate(input: string): string | null {
  const s = (input ?? '').trim()
  if (!s) return null
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s)
  if (m) {
    const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
    return parseISO(iso) ? iso : null
  }
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s)
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
    return parseISO(iso) ? iso : null
  }
  return null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(iso: string, fmt: DateFormat = 'D MMM YYYY', locale = 'en-US'): string {
  const d = parseISO(iso)
  if (!d) return iso || ''
  switch (fmt) {
    case 'YYYY-MM-DD':
      return iso
    case 'DD/MM/YYYY':
      return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}`
    case 'MM/DD/YYYY':
      return `${z(d.getMonth() + 1)}/${z(d.getDate())}/${d.getFullYear()}`
    case 'locale':
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d)
    default:
      return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
}

/** Keep the issue→due gap when an invoice is re-issued on `newIssue` (default today). */
export function shiftDueDate(issue: string, due: string, newIssue = todayISO()): string {
  const a = parseISO(issue), b = parseISO(due)
  if (!b) return ''
  const gap = a ? Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000)) : 0
  return addDays(newIssue, gap)
}

/** Overdue = past due date and not paid/cancelled/draft. */
export function isOverdue(dueISO: string, status: string, today = todayISO()): boolean {
  return !!dueISO && dueISO < today && (status === 'sent' || status === 'overdue')
}
