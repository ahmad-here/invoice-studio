import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FilePlus2, FolderOpen, LayoutDashboard, LayoutTemplate, Layers, LifeBuoy, Search, Settings, ShieldCheck, Smartphone, Users } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Spinner, Toaster, buttonClass, cx } from '@/components/common/ui'
import { useApp } from '@/app/store'
import { Logo } from './Logo'
import { InstallButton } from './InstallButton'
import { Tour } from './Tour'
import { isNative } from '@/services/files'
import { APP_MODE } from '@/lib/appMode'
import { AppShell } from './AppShell'

const NAV = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: LayoutDashboard, end: true, tour: 'nav-home' },
  { to: '/create', label: 'Create invoice', short: 'Create', icon: FilePlus2, tour: 'nav-create' },
  { to: '/invoices', label: 'Invoices', short: 'Saved', icon: FolderOpen, tour: 'nav-invoices' },
  { to: '/clients', label: 'Clients', short: 'Clients', icon: Users, tour: 'nav-clients' },
  { to: '/templates', label: 'Templates', short: 'Templates', icon: LayoutTemplate, tour: 'nav-templates', mobile: false },
  { to: '/bulk', label: 'Bulk generate', short: 'Bulk', icon: Layers, tour: 'nav-bulk' },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: Settings, tour: 'nav-settings' },
]

const FOOTER = [
  { h: 'Product', links: [['Create invoice', '/create'], ['Bulk generate', '/bulk'], ['Templates', '/templates'], ['Features', '/features'], ['Get the app', '/download']] },
  { h: 'Help', links: [['How to use', '/how-to-use'], ['FAQ', '/faq'], ['Support', '/support'], ['Contact', '/contact']] },
  { h: 'Legal', links: [['Privacy policy', '/privacy'], ['Terms of service', '/terms']] },
]

export function AppLayout() {
  return APP_MODE ? <AppShell /> : <WebLayout />
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function WebLayout() {
  const loc = useLocation()
  const nav = useNavigate()
  const business = useApp((s) => s.business)
  const [q, setQ] = useState('')
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const wide = loc.pathname.startsWith('/create') || loc.pathname.startsWith('/edit')
  const search = (e: React.FormEvent) => { e.preventDefault(); nav(`/invoices${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); setQ('') }

  return (
    <div className="min-h-dvh lg:pl-64">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <NavLink to="/" className="flex h-16 shrink-0 items-center gap-2.5 px-5" aria-label="Invoice Studio home">
          <Logo className="size-8" />
          <span className="text-[15px] font-semibold tracking-tight text-ink">Invoice Studio</span>
        </NavLink>
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-tour={n.tour} className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-primary text-white shadow-sm' : 'text-muted hover:bg-canvas hover:text-ink')}>
              <n.icon className="size-[18px]" aria-hidden />{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-2xl bg-gradient-to-br from-primary to-primary-700 p-4 text-white">
          <ShieldCheck className="size-6" aria-hidden />
          <p className="mt-2 text-sm font-semibold">Private & offline</p>
          <p className="mt-0.5 text-xs text-white/90">Invoices never leave this device. Export a backup in Settings.</p>
          {!isNative() && <Link to="/download" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary-700"><Smartphone className="size-3.5" aria-hidden />Get the app</Link>}
        </div>
        <Link to="/support" className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm text-ink hover:bg-canvas">
          <LifeBuoy className="size-5 text-primary" aria-hidden /><span><span className="block font-medium">Help & support</span><span className="block text-xs text-muted">Guides, FAQ, contact</span></span>
        </Link>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5 lg:hidden" aria-label="Invoice Studio home">
            <Logo className="size-8" />
            <span className="text-[15px] font-semibold tracking-tight text-ink">Invoice Studio</span>
          </NavLink>
          <p className="hidden shrink-0 text-[15px] font-semibold text-ink lg:block">{greeting()}{business.name ? `, ${business.name}` : ''}</p>
          <form role="search" onSubmit={search} className="relative ml-auto hidden w-full max-w-sm md:block lg:ml-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices…" aria-label="Search invoices"
              className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm placeholder:text-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-3 focus:ring-primary/15" />
          </form>
          <div className="ml-auto flex items-center gap-2 md:ml-0 lg:ml-auto">
            <InstallButton />
            {!isNative() && <Link to="/download" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-canvas hover:text-ink sm:flex lg:hidden" data-tour="get-app"><Smartphone className="size-4" aria-hidden />Get the app</Link>}
            <Link to="/settings" aria-label="Open settings" className="hidden size-10 items-center justify-center rounded-xl text-muted hover:bg-canvas hover:text-ink lg:flex"><Settings className="size-5" /></Link>
            <Link to="/create" className={cx(buttonClass({ variant: 'primary' }), 'hidden lg:inline-flex')}><FilePlus2 className="size-4" aria-hidden />Create invoice</Link>
          </div>
        </div>
      </header>

      <main id="main" className={cx('mx-auto w-full px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:pb-12', wide ? 'max-w-[1600px]' : 'max-w-6xl')}>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className={cx('border-t border-line bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0', wide && 'hidden lg:block')}>
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

      {/* Mobile/tablet bottom nav */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-6">
          {NAV.filter((n) => n.mobile !== false).map((n) => (
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
