import { useEffect, useRef, useState } from 'react'
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { Button, Modal } from '@/components/common/ui'

const FRAME = 280
const OUT = 512

/**
 * "Position your logo": drag to move, zoom and rotate inside a square frame.
 * Saves exactly what is inside the square as a transparent PNG.
 */
export function LogoCropper({ src, open, onCancel, onSave }: { src: string; open: boolean; onCancel: () => void; onSave: (dataUrl: string) => void }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rot, setRot] = useState(0)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ id: number; sx: number; sy: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const i = new Image()
    i.onload = () => { setImg(i); setZoom(1); setRot(0); setPos({ x: 0, y: 0 }) }
    i.src = src
  }, [src, open])

  // Zoom 1 = the whole logo fits inside the square
  const base = img ? FRAME / Math.max(img.naturalWidth, img.naturalHeight) : 1
  const scale = base * zoom

  const save = () => {
    if (!img) return
    const c = document.createElement('canvas')
    c.width = c.height = OUT
    const ctx = c.getContext('2d')!
    const k = OUT / FRAME
    ctx.translate(OUT / 2 + pos.x * k, OUT / 2 + pos.y * k)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.scale(scale * k, scale * k)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    onSave(c.toDataURL('image/png'))
  }

  const nudge = (dx: number, dy: number) => setPos((p) => ({ x: p.x + dx, y: p.y + dy }))

  return (
    <Modal open={open} onClose={onCancel} title="Position your logo" footer={<>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="primary" onClick={save} disabled={!img}>Save logo</Button>
    </>}>
      <p className="-mt-1 mb-4 text-sm text-muted">Drag to move it, then zoom and rotate. Everything inside the square is saved and shown on your invoices.</p>
      <div
        data-testid="logo-crop-frame"
        tabIndex={0}
        aria-label="Logo position. Drag, or use the arrow keys to move"
        className="relative mx-auto touch-none select-none overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ width: FRAME, height: FRAME, cursor: drag.current ? 'grabbing' : 'grab', backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg,#eef1f5 25%,transparent 25%,transparent 75%,#eef1f5 75%),linear-gradient(45deg,#eef1f5 25%,transparent 25%,transparent 75%,#eef1f5 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,10px 10px' }}
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y } }}
        onPointerMove={(e) => { const d = drag.current; if (d && d.id === e.pointerId) setPos({ x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }) }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
        onWheel={(e) => setZoom((z) => Math.min(5, Math.max(0.3, z - e.deltaY * 0.001)))}
        onKeyDown={(e) => {
          const m: Record<string, [number, number]> = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }
          if (m[e.key]) { e.preventDefault(); nudge(...m[e.key]) }
        }}
      >
        {img && <img src={src} alt="" draggable={false} className="pointer-events-none absolute max-w-none"
          style={{ left: '50%', top: '50%', width: img.naturalWidth, height: img.naturalHeight, transform: `translate(-50%,-50%) translate(${pos.x}px,${pos.y}px) rotate(${rot}deg) scale(${scale})` }} />}
        {/* guides: rule-of-thirds grid and frame edge */}
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset ring-primary/70" />
        <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right,rgba(6,146,244,.25) 1px,transparent 1px),linear-gradient(to bottom,rgba(6,146,244,.25) 1px,transparent 1px)', backgroundSize: `${FRAME / 3}px ${FRAME / 3}px`, backgroundPosition: '-1px -1px' }} />
      </div>
      <div className="mx-auto mt-5 flex max-w-[360px] items-center gap-3">
        <label htmlFor="logo-zoom" className="text-sm font-medium text-ink">Zoom</label>
        <ZoomOut className="size-4 text-muted" aria-hidden />
        <input id="logo-zoom" type="range" min={0.3} max={5} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--color-primary)]" />
        <ZoomIn className="size-4 text-muted" aria-hidden />
        <Button size="icon" variant="ghost" aria-label="Rotate 90°" onClick={() => setRot((r) => (r + 90) % 360)}><RotateCw className="size-4" /></Button>
      </div>
      <div className="mt-2 text-center"><button type="button" className="text-xs font-medium text-primary" onClick={() => { setZoom(1); setRot(0); setPos({ x: 0, y: 0 }) }}>Reset</button></div>
    </Modal>
  )
}
