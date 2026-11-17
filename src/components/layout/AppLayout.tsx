import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { FilePlus2, FolderOpen, LayoutDashboard, LayoutTemplate, Layers, Settings, Smartphone } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Spinner, Toaster, cx } from '@/components/common/ui'
import { Logo } from './Logo'
import { InstallButton } from './InstallButton'
import { Tour } from './Tour'
import { isNative } from '@/services/files'

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true, tour: 'nav-home' },
  { to: '/create', label: 'Create', short: 'Create', icon: FilePlus2, tour: 'nav-create' },
  { to: '/templates', label: 'Templates', short: 'Templates', icon: LayoutTemplate, tour: 'nav-templates' },
  { to: '/bulk', label: 'Bulk', short: 'Bulk', icon: Layers, tour: 'nav-bulk' },
  { to: '/invoices', label: 'Saved', short: 'Saved', icon: FolderOpen, tour: 'nav-invoices' },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: Settings, tour: 'nav-settings' },
]

const FOOTER = [
  { h: 'Product', links: [['Create invoice', '/create'], ['Bulk generate', '/bulk'], ['Templates', '/templates'], ['Features', '/features'], ['Get the app', '/download']] },
  { h: 'Help', links: [['How to use', '/how-to-use'], ['FAQ', '/faq'], ['Support', '/support'], ['Contact', '/contact']] },
  { h: 'Legal', links: [['Privacy policy', '/privacy']] },
]

export function AppLayout() {
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const wide = loc.pathname.startsWith('/create') || loc.pathname.startsWith('/edit')
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Invoice Studio home">
            <Logo className="size-8" />
            <span className="text-[15px] font-semibold tracking-tight text-ink">Invoice Studio</span>
          </NavLink>
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} data-tour={n.tour} className={({ isActive }) => cx('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary-50 text-primary-700' : 'text-muted hover:bg-canvas hover:text-ink')}>
                <n.icon className="size-4" aria-hidden />{n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <InstallButton />
            {!isNative() && (
              <Link to="/download" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink sm:flex" data-tour="get-app">
                <Smartphone className="size-4" aria-hidden />Get the app
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" className={cx('mx-auto w-full flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-12', wide ? 'max-w-[1600px]' : 'max-w-6xl')}>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="border-t border-line bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2"><Logo className="size-7" /><span className="font-semibold">Invoice Studio</span></div>
            <p className="mt-3 max-w-xs text-sm text-muted">Free online invoice generator. Create, print and bulk-generate PDF invoices — privately, on your device.</p>
          </div>
          {FOOTER.map((c) => (
            <nav key={c.h} aria-label={c.h}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">{c.h}</h2>
              <ul className="mt-3 space-y-2">{c.links.map(([l, to]) => <li key={to}><Link to={to} className="text-sm text-muted hover:text-ink">{l}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-subtle">© {new Date().getFullYear()} Invoice Studio · Your invoices never leave your device.</div>
      </footer>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-tour={n.tour} className={({ isActive }) => cx('flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted')}>
              <n.icon className="size-5" aria-hidden />{n.short}
            </NavLink>
          ))}
        </div>
      </nav>
      <Toaster />
      <Tour />
    </div>
  )
}
