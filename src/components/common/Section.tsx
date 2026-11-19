import type { ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'

/** Titled form card used by the editor and settings. `complete` shows a green “Completed” badge. */
export function Section({ title, description, children, aside, complete }: { title: string; description?: string; children: ReactNode; aside?: ReactNode; complete?: boolean }) {
  return (
    <section className={`rounded-2xl border bg-white p-4 shadow-xs transition-colors sm:p-5 ${complete ? 'border-success/30' : 'border-line'}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {complete && <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success"><CircleCheck className="size-3.5" aria-hidden />Completed</span>}
          </div>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}
