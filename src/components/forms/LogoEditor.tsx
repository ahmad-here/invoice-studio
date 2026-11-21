import { useRef, useState } from 'react'
import { Crop, ImagePlus, Trash2 } from 'lucide-react'
import { LogoCropper } from './LogoCropper'
import type { Logo, LogoPosition } from '@/types/invoice'
import { Button, Segmented } from '@/components/common/ui'
import { processLogo } from '@/lib/image'
import { toast } from '@/app/store'

/** Upload, replace, frame (drag / zoom / rotate) and align a logo (raster-only after processing). */
export function LogoEditor({ logo, onChange }: { logo?: Logo; onChange: (l: Logo | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  // Image being positioned in the cropper (the original upload, so re-adjusting doesn't lose detail)
  const [crop, setCrop] = useState<string | null>(null)
  const original = useRef<string | null>(null)
  const pick = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try { const l = await processLogo(f, logo); original.current = l.dataUrl; setCrop(l.dataUrl) } catch (e) { toast.error((e as Error).message) } finally { setBusy(false); if (ref.current) ref.current.value = '' }
  }
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-ink">Logo</span>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" aria-label="Upload logo" onChange={(e) => pick(e.target.files?.[0])} />
      {!logo ? (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]) }}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-line-strong bg-canvas px-4 py-4 text-left hover:border-primary hover:bg-primary-50 transition-colors">
          <ImagePlus className="size-6 text-primary shrink-0" />
          <span><span className="block text-sm font-medium text-ink">{busy ? 'Processing…' : 'Upload logo'}</span><span className="block text-xs text-muted">PNG, JPG, SVG or WebP · max 2 MB</span></span>
        </button>
      ) : (
        <div className="rounded-lg border border-line p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-28 items-center justify-center rounded-md bg-canvas p-1.5"><img src={logo.dataUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" /></div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<Crop className="size-4" />} onClick={() => setCrop(original.current ?? logo.dataUrl)}>Adjust</Button>
              <Button size="sm" onClick={() => ref.current?.click()} loading={busy}>Replace</Button>
              <Button size="sm" variant="danger-ghost" icon={<Trash2 className="size-4" />} onClick={() => onChange(undefined)}>Remove</Button>
            </div>
          </div>
          <div>
              <span className="mb-1.5 block text-[13px] font-medium">Position</span>
              <Segmented<LogoPosition> label="Logo position" size="sm" value={logo.position} onChange={(position) => onChange({ ...logo, position })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
          </div>
        </div>
      )}
      {crop && <LogoCropper open src={crop} onCancel={() => setCrop(null)}
        onSave={(dataUrl) => { onChange({ dataUrl, width: 512, height: 512, size: 90, position: logo?.position ?? 'left' }); setCrop(null) }} />}
    </div>
  )
}
