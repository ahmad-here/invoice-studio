import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { Logo, LogoPosition } from '@/types/invoice'
import { Button, Segmented } from '@/components/common/ui'
import { processLogo } from '@/lib/image'
import { toast } from '@/app/store'

/** Upload, replace, resize and position a logo (raster-only after processing). */
export function LogoEditor({ logo, onChange }: { logo?: Logo; onChange: (l: Logo | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const pick = async (f?: File) => {
    if (!f) return
    setBusy(true)
    try { onChange(await processLogo(f, logo)) } catch (e) { toast.error((e as Error).message) } finally { setBusy(false); if (ref.current) ref.current.value = '' }
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
              <Button size="sm" onClick={() => ref.current?.click()} loading={busy}>Replace</Button>
              <Button size="sm" variant="danger-ghost" icon={<Trash2 className="size-4" />} onClick={() => onChange(undefined)}>Remove</Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex justify-between text-[13px] font-medium" htmlFor="logo-size"><span>Size</span><span className="text-muted tabular">{logo.size}px</span></label>
              <input id="logo-size" type="range" min={40} max={260} step={4} value={logo.size} onChange={(e) => onChange({ ...logo, size: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" />
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium">Position</span>
              <Segmented<LogoPosition> label="Logo position" size="sm" value={logo.position} onChange={(position) => onChange({ ...logo, position })} options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
