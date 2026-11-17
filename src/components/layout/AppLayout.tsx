import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FilePlus2, FolderOpen, LayoutDashboard, LayoutTemplate, Layers, Settings } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Spinner, Toaster, cx } from '@/components/common/ui'
import { Logo } from './Logo'
import { InstallButton } from './InstallButton'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/create', label: 'Create', icon: FilePlus2 },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/bulk', label: 'Bulk', icon: Layers },
  { to: '/invoices', label: 'Saved', icon: FolderOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  const wide = loc.pathname.startsWith('/create') || loc.pathname.startsWith('/edit')
  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Invoice Studio home">
            <Logo className="size-8" />
            <span className="text-[15px] font-semibold tracking-tight text-ink">Invoice Studio</span>
          </NavLink>
          <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary-50 text-primary-700' : 'text-muted hover:text-ink hover:bg-canvas')}>
                <n.icon className="size-4" aria-hidden />{n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2"><InstallButton /></div>
        </div>
      </header>
      <main id="main" className={cx('mx-auto px-4 sm:px-6 pt-6 pb-28 lg:pb-12', wide ? 'max-w-[1600px]' : 'max-w-6xl')}>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-6">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted')}>
              <n.icon className="size-5" aria-hidden />{n.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Toaster />
    </div>
  )
}
