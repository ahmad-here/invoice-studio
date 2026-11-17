import { lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner } from '@/components/common/ui'
import { useApp } from './store'

const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'))
const Editor = lazy(() => import('@/features/invoice-editor/EditorPage'))
const Templates = lazy(() => import('@/features/invoice-templates/TemplatesPage'))
const Bulk = lazy(() => import('@/features/bulk-generator/BulkPage'))
const Saved = lazy(() => import('@/features/saved-invoices/SavedPage'))
const Settings = lazy(() => import('@/features/settings/SettingsPage'))
const Features = lazy(() => import('@/features/content/FeaturesPage'))
const HowTo = lazy(() => import('@/features/content/HowToPage'))
const Faq = lazy(() => import('@/features/content/FaqPage'))
const Support = lazy(() => import('@/features/content/SupportPage'))
const Contact = lazy(() => import('@/features/content/ContactPage'))
const Privacy = lazy(() => import('@/features/content/PrivacyPage'))
const DownloadApp = lazy(() => import('@/features/content/DownloadPage'))

/** A fresh editor per URL: unsaved work is flushed on unmount into the right draft slot. */
function EditorRoute() {
  const { pathname } = useLocation()
  return <Editor key={pathname} />
}

/** Old hash links (#/create) → clean paths, so bookmarks from earlier versions keep working. */
function redirectHash() {
  if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1))
}

export function App() {
  const { loaded, error, init } = useApp()
  useEffect(() => { redirectHash(); init() }, [init])
  if (!loaded) return <Spinner label="Opening Invoice Studio" />
  return (
    <BrowserRouter>
      {error && <div role="alert" className="bg-danger-50 px-4 py-2 text-center text-sm text-danger">{error}</div>}
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="create" element={<EditorRoute />} />
          <Route path="edit/:id" element={<EditorRoute />} />
          <Route path="templates" element={<Templates />} />
          <Route path="bulk" element={<Bulk />} />
          <Route path="invoices" element={<Saved />} />
          <Route path="settings" element={<Settings />} />
          <Route path="features" element={<Features />} />
          <Route path="how-to-use" element={<HowTo />} />
          <Route path="faq" element={<Faq />} />
          <Route path="support" element={<Support />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="download" element={<DownloadApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
