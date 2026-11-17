import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2 } from 'lucide-react'
import { Button } from '@/components/common/ui'

/** Readable article layout for content/SEO pages (~70ch measure per Refactoring UI). */
export function ContentLayout({ eyebrow, title, intro, children, cta = true }: { eyebrow?: string; title: string; intro?: ReactNode; children: ReactNode; cta?: boolean }) {
  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-10">
        {eyebrow && <p className="text-[13px] font-semibold text-primary">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>}
      </header>
      <div className="prose-content space-y-10">{children}</div>
      {cta && (
        <aside className="mt-14 flex flex-col items-start gap-4 rounded-2xl border border-line bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-ink">Ready to create your invoice?</p>
            <p className="text-sm text-muted">Free, private and no sign-up required.</p>
          </div>
          <Link to="/create"><Button variant="primary" icon={<FilePlus2 className="size-4" />}>Create invoice</Button></Link>
        </aside>
      )}
    </article>
  )
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return <h2 id={id} className="mb-3 text-xl font-semibold tracking-tight text-ink scroll-mt-24">{children}</h2>
}
export function P({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[15px] leading-relaxed text-[#374151]">{children}</p>
}
export function UL({ items }: { items: ReactNode[] }) {
  return <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#374151] marker:text-primary">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
}
