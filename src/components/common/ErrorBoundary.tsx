import { Component, type ReactNode } from 'react'

/**
 * Last-resort crash screen: never leave the user on a blank page. Offers reload and a way home;
 * saved invoices and autosaved drafts live in IndexedDB, so nothing is lost by reloading.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { console.error('Invoice Studio crashed:', error) }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center shadow-lg">
          <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">Your saved invoices and unsaved drafts are safe on this device. Reload to continue where you left off.</p>
          <p className="mt-3 break-words rounded-lg bg-canvas px-3 py-2 text-left font-mono text-xs text-muted">{this.state.error.message}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white" onClick={() => location.reload()}>Reload app</button>
            <button type="button" className="h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-ink" onClick={() => { location.href = '/' }}>Go to dashboard</button>
          </div>
        </div>
      </div>
    )
  }
}
