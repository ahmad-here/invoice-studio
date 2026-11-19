import { Suspense, useEffect, useRef } from 'react'
import { NavLink, Outlet, matchPath, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { Building2, ChevronLeft, FolderOpen, Home, Plus, Settings } from 'lucide-react'
import { Spinner, Toaster, cx } from '@/components/common/ui'
import { useAppBar } from '@/app/appBar'
import { haptic, onBackButton } from '@/services/native'
import { Logo } from './Logo'
import { Tour } from './Tour'

/** Screen titles for the app bar. */
const TITLES: [string, string][] = [
  ['/', 'Invoice Studio'], ['/create', 'New invoice'], ['/edit/:id', 'Edit invoice'], ['/templates', 'Templates'],
  ['/bulk', 'Bulk generate'], ['/invoices', 'Invoices'], ['/clients', 'Clients'], ['/business', 'My business'], ['/settings', 'Settings'], ['/features', 'Features'],
  ['/how-to-use', 'How to use'], ['/faq', 'FAQ'], ['/support', 'Help & support'], ['/contact', 'Contact us'],
  ['/privacy', 'Privacy policy'], ['/terms', 'Terms of service'], ['/download', 'Get the app'],
]
/** Top-level tabs show no back arrow. */
const ROOTS = ['/', '/invoices', '/business', '/settings']
/** Focused task screens hide the tab bar (like native detail screens). */
const FOCUS = ['/create', '/edit/:id']

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true, tour: 'nav-home' },
  { to: '/invoices', label: 'Invoices', icon: FolderOpen, tour: 'nav-invoices' },
  { to: '/create', label: 'Create', icon: Plus, fab: true, tour: 'nav-create' },
  { to: '/business', label: 'Business', icon: Building2, tour: 'nav-business' },
  { to: '/settings', label: 'Settings', icon: Settings, tour: 'nav-settings' },
]

const matches = (patterns: string[], path: string) => patterns.some((p) => matchPath({ path: p, end: true }, path))

export function AppShell() {
  const loc = useLocation()
  const nav = useNavigate()
  const navType = useNavigationType()
  const { actions, title: customTitle } = useAppBar()
  const isRoot = matches(ROOTS, loc.pathname)
  const focus = matches(FOCUS, loc.pathname)
  const title = customTitle ?? TITLES.find(([p]) => matchPath({ path: p, end: true }, loc.pathname))?.[1] ?? 'Invoice Studio'
  const depth = useRef(0)

  // Track in-app history depth so Back never leaves the app unexpectedly
  useEffect(() => {
    if (navType === 'PUSH') depth.current++
    else if (navType === 'POP') depth.current = Math.max(0, depth.current - 1)
    window.scrollTo(0, 0)
  }, [loc.key, navType])

  const goBack = () => (depth.current > 0 ? nav(-1) : nav('/', { replace: true }))

  // Android hardware back: close an open dialog/menu, else go back, else exit from Home
  useEffect(() => {
    let off: () => void = () => undefined
    onBackButton(() => {
      if (document.querySelector('[role="dialog"],[role="menu"]')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        return 'handled'
      }
      if (window.location.pathname === '/') return 'exit'
      goBack()
      return 'handled'
    }).then((f) => { off = f })
    return () => off()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center gap-1 px-2">
          {isRoot ? (
            <span className="flex size-11 items-center justify-center"><Logo className="size-7" /></span>
          ) : (
            <button type="button" onClick={goBack} aria-label="Back" className="flex size-11 items-center justify-center rounded-full text-ink active:bg-canvas">
              <ChevronLeft className="size-6" />
            </button>
          )}
          <h1 className="min-w-0 flex-1 truncate px-1 text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
          <div className="flex shrink-0 items-center gap-0.5 pr-1">{actions}</div>
        </div>
      </header>

      <main id="main" key={loc.pathname} className={cx('mx-auto w-full max-w-3xl flex-1 px-4 pt-4', focus ? 'pb-28' : 'pb-[calc(6.5rem+env(safe-area-inset-bottom))]', navType === 'POP' ? 'app-pop' : 'app-push')}>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      {!focus && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="grid h-16 grid-cols-5 items-end">
            {TABS.map((t) =>
              t.fab ? (
                <NavLink key={t.to} to={t.to} data-tour={t.tour} aria-label="Create invoice" onClick={() => haptic('light')} className="flex flex-col items-center justify-end pb-1.5">
                  <span className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white transition-transform active:scale-95"><Plus className="size-7" strokeWidth={2.5} /></span>
                  <span className="mt-0.5 text-[11px] font-medium text-muted">{t.label}</span>
                </NavLink>
              ) : (
                <NavLink key={t.to} to={t.to} end={t.end} data-tour={t.tour} onClick={() => haptic('light')} className={({ isActive }) => cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted')}>
                  {({ isActive }) => <>
                    <span className={cx('flex h-7 w-14 items-center justify-center rounded-full transition-colors', isActive && 'bg-primary-50')}><t.icon className="size-[22px]" strokeWidth={isActive ? 2.4 : 2} /></span>
                    {t.label}
                  </>}
                </NavLink>
              ),
            )}
          </div>
        </nav>
      )}
      <Toaster />
      <Tour />
    </div>
  )
}
