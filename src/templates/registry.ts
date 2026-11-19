import { useEffect, useState } from 'react'
import type { InvoiceTemplate, TemplateId } from '@/types/invoice'
import type { TemplateDef } from './types'

/** Static metadata so galleries can list templates without loading their code. */
export const TEMPLATES: InvoiceTemplate[] = [
  { id: 'classic', name: 'Classic Professional', description: 'Traditional corporate layout with a bordered item table.', bestFor: 'Any business' },
  { id: 'minimal', name: 'Modern Minimal', description: 'Airy layout, hairline rules and elegant typography.', bestFor: 'Consultants, designers' },
  { id: 'corporate', name: 'Corporate Blue', description: 'Branded blue header band with an organised financial summary.', bestFor: 'Agencies, B2B companies' },
  { id: 'executive', name: 'Executive', description: 'Premium serif typography with a prominent invoice number.', bestFor: 'Law firms, finance' },
  { id: 'creative', name: 'Creative Studio', description: 'Bold display heading, side accent band and rounded total card.', bestFor: 'Studios, creatives' },
  { id: 'elegant', name: 'Elegant Dark Accent', description: 'Sophisticated charcoal headings with restrained contrast.', bestFor: 'Boutiques, architects' },
  { id: 'compact', name: 'Compact Invoice', description: 'Dense, space-efficient layout for long item lists.', bestFor: 'Wholesale, long invoices' },
  { id: 'service', name: 'Service Invoice', description: 'Project details up front; service descriptions take centre stage.', bestFor: 'Freelancers, contractors' },
  { id: 'retail', name: 'Retail Invoice', description: 'Product-focused table with SKU, discount and tax columns.', bestFor: 'Shops, e-commerce' },
  { id: 'highlight', name: 'Highlight', description: 'Bold total-amount bar with soft card rows.', bestFor: 'Agencies, SaaS, modern brands' },
  { id: 'modern', name: 'Modern Business', description: 'Contemporary panels with a distinctive amount-due card.', bestFor: 'Startups, tech services' },
]

const loaders: Record<TemplateId, () => Promise<{ default: TemplateDef }>> = {
  classic: () => import('./classic'),
  minimal: () => import('./minimal'),
  corporate: () => import('./corporate'),
  executive: () => import('./executive'),
  creative: () => import('./creative'),
  elegant: () => import('./elegant'),
  compact: () => import('./compact'),
  service: () => import('./service'),
  retail: () => import('./retail'),
  modern: () => import('./modern'),
  highlight: () => import('./highlight'),
}

const cache = new Map<TemplateId, TemplateDef>()

export async function loadTemplate(id: TemplateId): Promise<TemplateDef> {
  const hit = cache.get(id)
  if (hit) return hit
  const def = (await (loaders[id] ?? loaders.classic)()).default
  cache.set(id, def)
  return def
}

export function useTemplate(id: TemplateId): TemplateDef | null {
  const [def, setDef] = useState<TemplateDef | null>(() => cache.get(id) ?? null)
  useEffect(() => {
    let live = true
    const hit = cache.get(id)
    if (hit) setDef(hit)
    else loadTemplate(id).then((d) => live && setDef(d))
    return () => { live = false }
  }, [id])
  return def && def.meta.id === id ? def : cache.get(id) ?? def
}
