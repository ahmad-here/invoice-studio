import { useSeo } from '@/hooks/useSeo'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { TemplateId } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, Modal, PageHeader } from '@/components/common/ui'
import { TEMPLATES } from '@/templates/registry'
import { TemplateThumb } from '@/components/invoice/TemplateThumb'
import { ScaledPreview } from '@/components/invoice/ScaledPreview'
import { sampleInvoice } from '@/lib/sample'
import { ToolGuide } from '@/features/content/SeoSections'

export default function TemplatesPage() {
  useSeo({ title: '21 Free Invoice Templates – Download as PDF', description: 'Free professional invoice templates: classic, modern, minimal, corporate, service, retail and more. Customise with your logo and download as PDF — no sign-up.', path: '/templates' })
  const { prefs, savePrefs } = useApp()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const open = params.get('t') as TemplateId | null
  const [cat, setCat] = useState<'All' | 'General' | 'Industry' | 'Document'>(() => (params.get('cat') as 'Industry') || 'All')
  const samples = useMemo(() => Object.fromEntries(TEMPLATES.map((t) => [t.id, sampleInvoice(t.id)])), [])

  const applyTemplate = (id: TemplateId) => {
    nav(`/create?template=${id}`)
    toast.success(`${TEMPLATES.find((t) => t.id === id)?.name} applied.`)
  }
  const setDefault = async (id: TemplateId) => { await savePrefs({ ...prefs, defaultTemplate: id }); toast.success('Default template updated.') }
  const current = TEMPLATES.find((t) => t.id === open)

  return (
    <div>
      <PageHeader title="Invoice templates" description="Twenty-one distinct, print-ready designs. Every template supports your logo, custom fields, multiple pages and all currencies." />
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin" role="radiogroup" aria-label="Template category">
        {(['All', 'General', 'Industry', 'Document'] as const).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)} className={`h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors ${cat === c ? 'border-primary bg-primary text-white' : 'border-line-strong bg-white text-ink hover:bg-canvas'}`}>
            {c === 'All' ? `All (${TEMPLATES.length})` : c === 'Document' ? 'Document types' : c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {TEMPLATES.filter((t) => cat === 'All' || t.category === cat).map((t) => (
          <div key={t.id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xs">
            <button type="button" onClick={() => setParams({ t: t.id })} className="group relative border-b border-line text-left" aria-label={`Preview ${t.name}`}>
              <span className="absolute inset-x-0 bottom-2 z-10 mx-auto w-fit rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">Preview</span>
              <TemplateThumb invoice={samples[t.id]} />
              {prefs.defaultTemplate === t.id && <span className="absolute left-2 top-2"><Badge tone="blue"><Check className="size-3" />Default</Badge></span>}
            </button>
            <div className="flex flex-1 flex-col p-3">
              <div className="text-sm font-semibold text-ink">{t.name}</div>
              <p className="mt-0.5 flex-1 text-xs text-muted">{t.description}</p>
              <Button size="sm" variant="secondary" className="mt-3 w-full justify-center" onClick={() => applyTemplate(t.id)}>Use template</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!current} onClose={() => setParams({})} title={current?.name ?? ''} size="lg" footer={current && <>
        <Button onClick={() => setDefault(current.id)} disabled={prefs.defaultTemplate === current.id}>{prefs.defaultTemplate === current.id ? 'Default template' : 'Set as default'}</Button>
        <Button variant="primary" onClick={() => applyTemplate(current.id)}>Use this template</Button>
      </>}>
        {current && <>
          <p className="mb-4 text-sm text-muted">{current.description} Best for: {current.bestFor}.</p>
          <div className="rounded-lg bg-[#eef1f5] p-3 sm:p-5"><ScaledPreview invoice={samples[current.id]} prefs={prefs} /></div>
        </>}
      </Modal>
      <ToolGuide title="Free invoice templates you can customise" paragraphs={[
        'Every invoice template uses the same data, so you can switch designs at any time without retyping. Add your logo, choose an accent colour and paper size (A4, Letter or Legal), then download a print-ready PDF invoice.',
        'Pick Classic Professional or Corporate Blue for formal business invoices, Service Invoice for freelancers and consultants, Retail Invoice for products with SKUs, or Compact for long item lists.',
      ]} links={[['Create an invoice', '/create'], ['Bulk generate invoices', '/bulk'], ['All features', '/features']]} />
    </div>
  )
}
