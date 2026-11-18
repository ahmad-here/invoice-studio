import { useEffect, type ReactNode } from 'react'
import { create } from 'zustand'

/** Per-screen actions shown on the right of the mobile app bar. */
interface AppBarState { actions: ReactNode; title: string | null; set: (p: { actions?: ReactNode; title?: string | null }) => void }
export const useAppBar = create<AppBarState>((set) => ({ actions: null, title: null, set: (p) => set(p) }))

/** Register app-bar actions/title for the current screen; cleared automatically on unmount. */
export function useAppBarActions(actions: ReactNode, title?: string | null, deps: unknown[] = []) {
  useEffect(() => {
    useAppBar.getState().set({ actions, title: title ?? null })
    return () => useAppBar.getState().set({ actions: null, title: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
