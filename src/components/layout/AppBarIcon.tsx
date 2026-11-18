import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/** 44px circular icon button for the mobile app bar. */
export function AppBarIcon({ label, onClick, children, busy }: { label: string; onClick: () => void; children: ReactNode; busy?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={busy}
      className="flex size-11 items-center justify-center rounded-full text-ink transition-colors active:bg-canvas disabled:opacity-50">
      {busy ? <Loader2 className="size-5 animate-spin" /> : children}
    </button>
  )
}
