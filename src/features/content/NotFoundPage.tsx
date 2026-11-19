import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { buttonClass } from '@/components/common/ui'
import { useSeo } from '@/hooks/useSeo'

/** Real 404 (noindex) instead of silently redirecting — avoids soft-404s and tells users where to go. */
export default function NotFoundPage() {
  useSeo({ title: 'Page not found', description: 'The page you are looking for does not exist.', path: '/404', noindex: true })
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary"><FileQuestion className="size-8" aria-hidden /></span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-2 text-[15px] text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className={buttonClass({ variant: 'primary' })}>Go to dashboard</Link>
        <Link to="/create" className={buttonClass()}>Create invoice</Link>
        <Link to="/support" className={buttonClass({ variant: 'ghost' })}>Get help</Link>
      </div>
    </div>
  )
}
