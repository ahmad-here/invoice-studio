import type { FC, ReactNode } from 'react'
import type { Invoice, InvoiceItem, InvoiceTemplate, InvoiceTotals, LineTotals, Minor, PaperSize, UserPreferences } from '@/types/invoice'

export interface RenderCtx {
  inv: Invoice
  totals: InvoiceTotals
  prefs: Pick<UserPreferences, 'dateFormat' | 'locale'>
  money: (m: Minor) => string
  date: (iso: string) => string
  accent: string
  /** which optional item columns carry data */
  has: { sku: boolean; unit: boolean; discount: boolean; tax: boolean; description: boolean }
}

export interface Column {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  /** CSS width (e.g. '12%'); omit for flexible column */
  width?: string
  render: (item: InvoiceItem, line: LineTotals, index: number) => ReactNode
}

export interface TemplateDef {
  meta: InvoiceTemplate
  accent: string
  /** page padding in px (96dpi). Footer lives inside the bottom padding. */
  pad: { x: number; top: number; bottom: number }
  /** vertical gap between summary blocks, px */
  gap: number
  rootClass: string
  Background?: FC<{ ctx: RenderCtx; page: number; pageCount: number }>
  Header: FC<{ ctx: RenderCtx }>
  ContHeader: FC<{ ctx: RenderCtx; page: number }>
  columns: (ctx: RenderCtx) => Column[]
  table: { className: string; theadClass: string; thClass: string; tdClass: string; rowClass?: (i: number) => string }
  summary: (ctx: RenderCtx) => ReactNode[]
  Footer: FC<{ ctx: RenderCtx; page: number; pageCount: number }>
}

export const PAGE_PX: Record<PaperSize, { w: number; h: number; mm: [number, number] }> = {
  A4: { w: 794, h: 1123, mm: [210, 297] },
  Letter: { w: 816, h: 1056, mm: [215.9, 279.4] },
  Legal: { w: 816, h: 1344, mm: [215.9, 355.6] },
}
