import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Eye } from 'lucide-react'
import type { TemplateId } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, Modal, PageHeader } from '@/components/common/ui'
import { TEMPLATES } from '@/templates/registry'
import { TemplateThumb } from '@/components/invoice/TemplateThumb'
import { ScaledPreview } from '@/components/invoice/ScaledPreview'
import { sampleInvoice } from '@/lib/sample'

export default function TemplatesPage() {
  const { prefs, savePrefs } = useApp()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const open = params.get('t') as TemplateId | null
  const samples = useMemo(() => Object.fromEntries(TEMPLATES.map((t) => [t.id, sampleInvoice(t.id)])), [])

  const useInEditor = (id: TemplateId) => {
    nav(`/create?template=${id}`)
    toast.success(`${TEMPLATES.find((t) => t.id === id)?.name} applied.`)
  }
  const setDefault = async (id: TemplateId) => { await savePrefs({ ...prefs, defaultTemplate: id }); toast.success('Default template updated.') }
  const current = TEMPLATES.find((t) => t.id === open)

  return (
    <div>
      <PageHeader title="Invoice templates" description="Ten distinct, print-ready designs. Every template supports your logo, custom fields, multiple pages and all currencies." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xs">
            <button type="button" onClick={() => setParams({ t: t.id })} className="relative border-b border-line text-left" aria-label={`Preview ${t.name}`}>
              <TemplateThumb invoice={samples[t.id]} />
              {prefs.defaultTemplate === t.id && <span className="absolute left-2 top-2"><Badge tone="blue"><Check className="size-3" />Default</Badge></span>}
            </button>
            <div className="flex flex-1 flex-col p-3">
              <div className="text-sm font-semibold text-ink">{t.name}</div>
              <p className="mt-0.5 flex-1 text-xs text-muted">{t.description}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1 justify-center" icon={<Eye className="size-4" />} onClick={() => setParams({ t: t.id })}>Preview</Button>
                <Button size="sm" variant="primary" className="flex-1 justify-center" onClick={() => useInEditor(t.id)}>Use</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!current} onClose={() => setParams({})} title={current?.name ?? ''} size="lg" footer={current && <>
        <Button onClick={() => setDefault(current.id)} disabled={prefs.defaultTemplate === current.id}>{prefs.defaultTemplate === current.id ? 'Default template' : 'Set as default'}</Button>
        <Button variant="primary" onClick={() => useInEditor(current.id)}>Use this template</Button>
      </>}>
        {current && <>
          <p className="mb-4 text-sm text-muted">{current.description} Best for: {current.bestFor}.</p>
          <div className="rounded-lg bg-[#eef1f5] p-3 sm:p-5"><ScaledPreview invoice={samples[current.id]} prefs={prefs} /></div>
        </>}
      </Modal>
    </div>
  )
}
