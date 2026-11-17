import { useSeo } from '@/hooks/useSeo'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Download, Eye, FileArchive, FileJson, FileSpreadsheet, FileStack, RefreshCw, Save, UploadCloud, XCircle } from 'lucide-react'
import type { BulkImportResult, Invoice, PaperSize, TemplateId } from '@/types/invoice'
import { useApp, toast } from '@/app/store'
import { Badge, Button, Card, Input, Modal, PageHeader, Progress, Segmented, Select, cx } from '@/components/common/ui'
import { ScaledPreview } from '@/components/invoice/ScaledPreview'
import { CSV_FIELDS, SAMPLE_CSV, SAMPLE_JSON } from '@/services/bulk/fields'
import { MAX_FILE_BYTES, errorReportCsv, type ParseContext } from '@/services/bulk/parse'
import { applyPattern, saveFile, saveText } from '@/services/files'
import { calculateTotals } from '@/lib/calc'
import { formatMoney } from '@/lib/money'
import { todayISO } from '@/lib/dates'
import { TEMPLATES } from '@/templates/registry'

interface Parsed { name: string; text: string; result: BulkImportResult; headers: string[]; mapping: Record<string, string | null> }
const PAGE = 50

function runWorker(name: string, text: string, ctx: ParseContext, mapping?: Record<string, string | null>): Promise<Omit<Parsed, 'name' | 'text'>> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('../../services/bulk/bulk.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e) => { w.terminate(); if (e.data.ok) resolve(e.data); else reject(new Error(e.data.error)) }
    w.onerror = (e) => { w.terminate(); reject(new Error(e.message || 'Parser crashed')) }
    w.postMessage({ name, text, ctx, mapping })
  })
}

export default function BulkPage() {
  useSeo({ title: 'Bulk Invoice Generator – Create Invoices from CSV or JSON', description: 'Generate hundreds of PDF invoices from one CSV or JSON file. Validation report, ZIP download and combined PDF. Free and private.', path: '/bulk' })
  const { prefs, business: defaultBusiness, businesses, invoices: saved, saveMany } = useApp()
  const [businessId, setBusinessId] = useState<string>(defaultBusiness.id ?? '')
  const business = businesses.find((b) => b.id === businessId) ?? defaultBusiness
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [template, setTemplate] = useState<TemplateId>(prefs.defaultTemplate)
  const [paper, setPaper] = useState<PaperSize>(prefs.defaultPaperSize)
  const [pattern, setPattern] = useState('Invoice-{number}')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [issueFilter, setIssueFilter] = useState<'all' | 'error' | 'warning'>('all')
  const [issueLimit, setIssueLimit] = useState(100)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [job, setJob] = useState<{ label: string; done: number; total: number } | null>(null)
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [savedOnce, setSavedOnce] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const ctx = useMemo<ParseContext>(() => ({ prefs, business, existingNumbers: saved.map((i) => i.number) }), [prefs, business, saved])

  const handleFile = useCallback(async (f?: File) => {
    if (!f) return
    setFileError(null)
    if (!/\.(csv|json|txt)$/i.test(f.name) && !['text/csv', 'application/json', 'text/plain', 'application/vnd.ms-excel'].includes(f.type)) {
      setFileError('Unsupported file type. Upload a .csv or .json file.')
      return
    }
    if (f.size > MAX_FILE_BYTES) { setFileError('File is larger than 20 MB. Split it into smaller files.'); return }
    if (f.size === 0) { setFileError('The file is empty.'); return }
    setLoading(true)
    try {
      const text = await f.text()
      const res = await runWorker(f.name, text, ctx)
      setParsed({ name: f.name, text, ...res })
      setMapping(res.mapping)
      setSelected(new Set(res.result.invoices.map((i) => i.id)))
      setPage(0)
      setSavedOnce(false)
    } catch (e) {
      setFileError(`Could not read the file: ${(e as Error).message}`)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [ctx])

  const revalidate = async () => {
    if (!parsed) return
    setLoading(true)
    try {
      const res = await runWorker(parsed.name, parsed.text, ctx, mapping)
      setParsed({ ...parsed, ...res })
      setSelected(new Set(res.result.invoices.map((i) => i.id)))
      setPage(0)
      toast.success('Mapping applied and data re-validated.')
    } catch (e) { toast.error((e as Error).message) } finally { setLoading(false) }
  }

  // Re-run validation when the fallback business profile changes
  const lastBiz = useRef(businessId)
  useEffect(() => {
    if (lastBiz.current === businessId) return
    lastBiz.current = businessId
    if (parsed) revalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const result = parsed?.result
  const ready: Invoice[] = useMemo(() => (result?.invoices ?? []).map((i) => ({ ...i, template, paperSize: paper })), [result, template, paper])
  const chosen = useMemo(() => ready.filter((i) => selected.has(i.id)), [ready, selected])
  const errors = result?.issues.filter((i) => i.severity === 'error').length ?? 0
  const warnings = result?.issues.filter((i) => i.severity === 'warning').length ?? 0
  const shownIssues = (result?.issues ?? []).filter((i) => issueFilter === 'all' || i.severity === issueFilter)
  const fileNameFor = (inv: Invoice) => applyPattern(pattern, { number: inv.number, customer: inv.customer.name || inv.customer.company, date: inv.issueDate, status: inv.status })

  const uniqueNames = (list: Invoice[]) => {
    const used = new Map<string, number>()
    return list.map((inv) => {
      const base = fileNameFor(inv)
      const n = used.get(base) ?? 0
      used.set(base, n + 1)
      return `${n ? `${base}-${n + 1}` : base}.pdf`
    })
  }

  const runJob = async (label: string, fn: (signal: AbortSignal) => Promise<void>) => {
    abort.current = new AbortController()
    try { await fn(abort.current.signal) }
    catch (e) { if ((e as Error).name === 'AbortError') toast.info('Generation cancelled.'); else toast.error(`${label} failed: ${(e as Error).message}`) }
    finally { setJob(null); abort.current = null }
  }

  const downloadZip = () => runJob('ZIP export', async (signal) => {
    const [{ default: JSZip }, { invoiceToPdfBlob, yieldToBrowser }] = await Promise.all([import('jszip'), import('@/services/pdf/pdf')])
    const zip = new JSZip()
    const names = uniqueNames(chosen)
    setJob({ label: 'Generating PDFs', done: 0, total: chosen.length })
    for (let i = 0; i < chosen.length; i++) {
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
      zip.file(names[i], await invoiceToPdfBlob(chosen[i], prefs))
      setJob({ label: 'Generating PDFs', done: i + 1, total: chosen.length })
      await yieldToBrowser()
    }
    setJob({ label: 'Packing ZIP', done: chosen.length, total: chosen.length })
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
    await saveFile(blob, `Generated-Invoices-${todayISO()}.zip`)
    toast.success(`${chosen.length} invoices downloaded as ZIP.`)
  })

  const downloadCombined = () => runJob('Combined PDF', async (signal) => {
    const { combinedPdfBlob } = await import('@/services/pdf/pdf')
    setJob({ label: 'Building combined PDF', done: 0, total: chosen.length })
    const blob = await combinedPdfBlob(chosen, prefs, (done) => setJob({ label: 'Building combined PDF', done, total: chosen.length }), signal)
    await saveFile(blob, `Invoices-Combined-${todayISO()}.pdf`)
    toast.success(`Combined PDF with ${chosen.length} invoices downloaded.`)
  })

  const downloadOne = (inv: Invoice) => runJob('PDF export', async () => {
    const { invoiceToPdfBlob } = await import('@/services/pdf/pdf')
    setJob({ label: `Generating ${inv.number}`, done: 0, total: 1 })
    await saveFile(await invoiceToPdfBlob(inv, prefs), `${fileNameFor(inv)}.pdf`)
  })

  const saveAll = async () => {
    const existing = new Set(useApp.getState().invoices.map((i) => i.number))
    const fresh = chosen.filter((i) => !existing.has(i.number))
    const skipped = chosen.length - fresh.length
    if (fresh.length) await saveMany(fresh)
    setSavedOnce(true)
    if (fresh.length) toast.success(`${fresh.length} invoice${fresh.length === 1 ? '' : 's'} saved to Saved Invoices.${skipped ? ` ${skipped} skipped — number already exists.` : ''}`)
    else toast.info('Nothing saved — every selected invoice number already exists in Saved Invoices.')
  }

  const reset = () => { setParsed(null); setSelected(new Set()); setFileError(null) }
  const pageItems = ready.slice(page * PAGE, (page + 1) * PAGE)
  const pages = Math.ceil(ready.length / PAGE)
  const preview = ready.find((i) => i.id === previewId)
  const allSelected = ready.length > 0 && selected.size === ready.length

  return (
    <div>
      <PageHeader title="Bulk generate" description="Create hundreds of invoices from one CSV or JSON file. Files are processed on this device — nothing is uploaded." actions={parsed && <Button icon={<RefreshCw className="size-4" />} onClick={reset}>Start over</Button>} />

      {/* Step indicator */}
      <ol className="mb-6 flex flex-wrap gap-2 text-[13px]" aria-label="Progress">
        {['Upload', 'Review & fix', 'Generate & download'].map((s, i) => {
          const step = !parsed ? 0 : (result && (result.issues.length || result.failed.length || !result.invoices.length)) ? 1 : 2
          return (
            <li key={s} className={cx('flex items-center gap-2 rounded-full border px-3 py-1', i === step ? 'border-primary bg-primary text-white font-medium' : i < step ? 'border-primary-100 bg-white text-primary-700' : 'border-line text-muted')} aria-current={i === step ? 'step' : undefined}>
              {i < step ? <Check className="size-3.5" aria-label="done" /> : <span className="tabular">{i + 1}</span>}{s}
            </li>
          )
        })}
      </ol>

      {!parsed && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              className={cx('flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-14 text-center transition-colors', dragOver ? 'border-primary bg-primary-50' : 'border-line-strong')}>
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary"><UploadCloud className="size-7" /></div>
              <p className="text-base font-semibold text-ink">{loading ? 'Reading file…' : 'Drop your CSV or JSON file here'}</p>
              <p className="mt-1 text-sm text-muted">Up to 20 MB · rows with the same invoice number become one invoice</p>
              <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" aria-label="Choose CSV or JSON file" onChange={(e) => handleFile(e.target.files?.[0])} />
              <Button variant="primary" className="mt-5" loading={loading} onClick={() => fileRef.current?.click()}>Browse files</Button>
              {fileError && <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm text-danger"><XCircle className="size-4" />{fileError}</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={<FileSpreadsheet className="size-4" />} onClick={() => saveText(SAMPLE_CSV, 'sample-invoices.csv', 'text/csv')}>Sample CSV</Button>
              <Button icon={<FileJson className="size-4" />} onClick={() => saveText(SAMPLE_JSON, 'sample-invoices.json', 'application/json')}>Sample JSON</Button>
            </div>
          </div>
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">CSV columns</h2>
            <p className="mt-1 text-[13px] text-muted">Required columns are marked. Headers are matched automatically (e.g. “Qty” → quantity) and can be remapped after upload. Add <code className="rounded bg-canvas px-1">custom:Label</code> columns for custom fields.</p>
            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1 text-[13px] scrollbar-thin">
              {CSV_FIELDS.map((f) => (
                <li key={f.key} className="flex items-baseline gap-2">
                  <code className={cx('rounded px-1.5 py-0.5 text-xs', f.required ? 'bg-primary-50 text-primary-700' : 'bg-canvas text-ink')}>{f.key}</code>
                  <span className="text-muted">{f.required ? 'required' : f.description || f.label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {parsed && result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: 'Ready to generate', v: result.invoices.length, tone: 'text-success', icon: CheckCircle2 },
              { k: 'Failed invoices', v: result.failed.length, tone: result.failed.length ? 'text-danger' : 'text-muted', icon: XCircle },
              { k: 'Line items', v: result.totalItems, tone: 'text-ink', icon: FileStack },
              { k: result.format === 'csv' ? 'Rows read' : 'Records read', v: result.totalRows, tone: 'text-ink', icon: FileSpreadsheet },
            ].map((s) => (
              <Card key={s.k} className="p-4">
                <div className={cx('flex items-center gap-2 text-2xl font-semibold tabular', s.tone)}><s.icon className="size-5" />{s.v}</div>
                <div className="mt-0.5 text-xs text-muted">{s.k}</div>
              </Card>
            ))}
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-warning" />
                  <h2 className="text-[15px] font-semibold">Validation report</h2>
                  {errors > 0 && <Badge tone="red">{errors} {errors === 1 ? 'error' : 'errors'}</Badge>}{warnings > 0 && <Badge tone="amber">{warnings} {warnings === 1 ? 'warning' : 'warnings'}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented size="sm" label="Filter issues" value={issueFilter} onChange={setIssueFilter} options={[{ value: 'all', label: 'All' }, { value: 'error', label: 'Errors' }, { value: 'warning', label: 'Warnings' }]} />
                  <Button size="sm" icon={<Download className="size-4" />} onClick={() => saveText(errorReportCsv(result.issues), `import-errors-${todayISO()}.csv`, 'text/csv')}>Error report</Button>
                </div>
              </div>
              <div className="max-h-80 overflow-auto scrollbar-thin">
                <table className="w-full text-left text-[13px]">
                  <thead className="sticky top-0 bg-canvas text-xs text-muted"><tr><th className="px-5 py-2 font-medium">{result.format === 'csv' ? 'Row' : '#'}</th><th className="hidden px-3 py-2 font-medium sm:table-cell">Invoice</th><th className="hidden px-3 py-2 font-medium sm:table-cell">Field</th><th className="px-3 py-2 font-medium">Problem</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {shownIssues.slice(0, issueLimit).map((i, k) => (
                      <tr key={k}>
                        <td className="px-5 py-2 tabular text-muted">{i.row || '—'}</td>
                        <td className="hidden px-3 py-2 font-medium sm:table-cell">{i.invoiceNumber ?? '—'}</td>
                        <td className="hidden px-3 py-2 text-muted sm:table-cell"><code className="text-xs">{i.field ?? ''}</code></td>
                        <td className={cx('px-3 py-2', i.severity === 'error' ? 'text-danger' : 'text-warning')}><span className="mb-0.5 block text-xs text-muted sm:hidden">{[i.invoiceNumber, i.field].filter(Boolean).join(' · ')}</span>{i.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shownIssues.length > issueLimit && <div className="p-3 text-center"><Button size="sm" onClick={() => setIssueLimit(issueLimit + 200)}>Show more ({shownIssues.length - issueLimit})</Button></div>}
              </div>
              {result.failed.length > 0 && <p className="border-t border-line px-5 py-3 text-[13px] text-muted">Failed invoices were <b>not</b> generated: {result.failed.slice(0, 12).map((f) => f.invoiceNumber).join(', ')}{result.failed.length > 12 ? ` and ${result.failed.length - 12} more` : ''}. Fix them in your file and upload again, or adjust the column mapping below.</p>}
            </Card>
          )}

          {/* Mapping (CSV) */}
          {result.format === 'csv' && parsed.headers.length > 0 && (
            <details className="group rounded-xl border border-line bg-white shadow-xs" open={result.invoices.length === 0}>
              <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-[15px] font-semibold">Column mapping <span className="text-xs font-normal text-muted">{parsed.headers.length} columns detected</span></summary>
              <div className="border-t border-line p-5">
                {[true, false].map((req) => {
                  const fields = CSV_FIELDS.filter((f) => !!f.required === req)
                  const grid = (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {fields.map((f) => (
                        <Select key={f.key} label={<>{f.label}{f.required && <span className="text-danger"> *</span>}</>} value={mapping[f.key] ?? ''} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value || null })}>
                          <option value="">Not mapped</option>
                          {parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </Select>
                      ))}
                    </div>
                  )
                  return req
                    ? <div key="req"><h3 className="mb-3 text-sm font-semibold text-ink">Required</h3>{grid}</div>
                    : <details key="opt" className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-ink">Optional fields ({fields.filter((f) => mapping[f.key]).length}/{fields.length} mapped)</summary><div className="mt-3">{grid}</div></details>
                })}
                <div className="sticky bottom-[calc(7.5rem+env(safe-area-inset-bottom))] -mx-5 mt-4 border-t border-line bg-white/95 px-5 py-3 backdrop-blur lg:bottom-0">
                  <Button variant="primary" loading={loading} onClick={revalidate}>Apply mapping & re-validate</Button>
                </div>
              </div>
            </details>
          )}

          {result.invoices.length > 0 && <>
            {/* Options */}
            <Card className="p-5">
              <h2 className="mb-4 text-[15px] font-semibold">Output options</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {businesses.length > 1 && (
                  <Select label="Business profile" className="md:col-span-3" hint="Used for invoices whose file doesn't include business details. " value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                    {businesses.map((b) => <option key={b.id} value={b.id}>{b.name || 'Untitled business'}</option>)}
                  </Select>
                )}
                <Select label="Template" value={template} onChange={(e) => setTemplate(e.target.value as TemplateId)}>
                  {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
                <div><span className="mb-1.5 block text-[13px] font-medium">Paper size</span><Segmented label="Paper size" value={paper} onChange={setPaper} options={[{ value: 'A4', label: 'A4' }, { value: 'Letter', label: 'Letter' }, { value: 'Legal', label: 'Legal' }]} /></div>
                <Input label="Filename pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} hint={`Tokens: {number} {customer} {date} {status} → ${fileNameFor(ready[0])}.pdf`} />
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-5">
              {job ? (
                <div className="flex items-end gap-3" role="status" aria-live="polite">
                  <div className="flex-1"><Progress value={job.done} max={job.total} label={job.label} /></div>
                  <Button size="sm" variant="secondary" onClick={() => abort.current?.abort()}>Stop</Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-auto text-sm text-muted"><b className="text-ink">{chosen.length}</b> of {ready.length} selected</span>
                  <Button icon={<Save className="size-4" />} disabled={!chosen.length || savedOnce} onClick={saveAll}>{savedOnce ? 'Saved' : 'Save to invoices'}</Button>
                  <Button icon={<FileStack className="size-4" />} disabled={!chosen.length} onClick={downloadCombined}>Combined PDF</Button>
                  <Button variant="primary" icon={<FileArchive className="size-4" />} disabled={!chosen.length} onClick={downloadZip}>Download ZIP</Button>
                </div>
              )}
            </Card>

            {/* Invoice list (paged; previews render one at a time) */}
            <Card>
              <div className="flex items-center gap-3 border-b border-line px-5 py-3">
                <input type="checkbox" id="sel-all" checked={allSelected} ref={(el) => { if (el) el.indeterminate = selected.size > 0 && !allSelected }} onChange={() => setSelected(allSelected ? new Set() : new Set(ready.map((i) => i.id)))} className="size-4 accent-[var(--color-primary)]" />
                <label htmlFor="sel-all" className="text-sm font-medium">Select all</label>
                <span className="ml-auto text-xs text-muted">Page {page + 1} of {pages}</span>
              </div>
              <ul className="divide-y divide-line">
                {pageItems.map((inv) => {
                  const t = calculateTotals(inv)
                  return (
                    <li key={inv.id} className="flex items-center gap-3 px-5 py-2.5">
                      <input type="checkbox" aria-label={`Select ${inv.number}`} checked={selected.has(inv.id)} onChange={() => { const s = new Set(selected); if (s.has(inv.id)) s.delete(inv.id); else s.add(inv.id); setSelected(s) }} className="size-4 accent-[var(--color-primary)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{inv.number} <span className="font-normal text-muted">· {inv.customer.name || inv.customer.company}</span></div>
                        <div className="text-xs text-muted">{inv.items.length} item{inv.items.length === 1 ? '' : 's'} · {inv.issueDate} · {inv.currency}</div>
                      </div>
                      <div className="hidden text-sm font-semibold tabular sm:block">{formatMoney(t.grandTotal, inv.currency)}</div>
                      <Button size="icon" variant="ghost" aria-label={`Preview ${inv.number}`} onClick={() => setPreviewId(inv.id)}><Eye className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label={`Download ${inv.number} PDF`} disabled={!!job} onClick={() => downloadOne(inv)}><Download className="size-4" /></Button>
                    </li>
                  )
                })}
              </ul>
              {pages > 1 && (
                <div className="flex items-center justify-between border-t border-line px-5 py-3">
                  <Button size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
                  <span className="text-xs text-muted">{page * PAGE + 1}–{Math.min(ready.length, (page + 1) * PAGE)} of {ready.length}</span>
                  <Button size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              )}
            </Card>
          </>}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreviewId(null)} title={preview ? `Invoice ${preview.number}` : ''} size="lg" footer={preview && <Button variant="primary" icon={<Download className="size-4" />} onClick={() => downloadOne(preview)}>Download PDF</Button>}>
        {preview && <div className="rounded-lg bg-[#eef1f5] p-3 sm:p-5"><ScaledPreview invoice={preview} prefs={prefs} /></div>}
      </Modal>
    </div>
  )
}
