import { lazy, useEffect } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/common/ui'
import { useApp } from './store'

const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'))
const Editor = lazy(() => import('@/features/invoice-editor/EditorPage'))
const Templates = lazy(() => import('@/features/invoice-templates/TemplatesPage'))
const Bulk = lazy(() => import('@/features/bulk-generator/BulkPage'))
const Saved = lazy(() => import('@/features/saved-invoices/SavedPage'))
const Settings = lazy(() => import('@/features/settings/SettingsPage'))

export function App() {
  const { loaded, error, init } = useApp()
  useEffect(() => { init() }, [init])
  if (!loaded) return <Spinner label="Opening Invoice Studio" />
  return (
    <HashRouter>
      {error && <div role="alert" className="bg-danger-50 text-danger text-sm px-4 py-2 text-center">{error}</div>}
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<Editor />} />
          <Route path="edit/:id" element={<Editor />} />
          <Route path="templates" element={<Templates />} />
          <Route path="bulk" element={<Bulk />} />
          <Route path="invoices" element={<Saved />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
