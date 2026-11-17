import type { ReactNode } from 'react'

/** Titled form card used by the editor and settings. */
export function Section({ title, description, children, aside }: { title: string; description?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 sm:p-5 shadow-xs">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}
