import { useEffect, useState } from 'react'
import { Download, MonitorSmartphone, Smartphone } from 'lucide-react'
import { ContentLayout, H2, UL } from './ContentLayout'
import { buttonClass, Card } from '@/components/common/ui'
import { useSeo } from '@/hooks/useSeo'
import { SITE } from '@/config/site'
import { isNative } from '@/services/files'

/** Android APK + PWA install instructions. Checks the APK actually exists before offering it. */
export default function DownloadPage() {
  useSeo({ title: 'Invoice Generator App for Android – Free APK Download', description: 'Get the free Invoice Studio app for Android (APK) or install it on any phone or computer from your browser. Works offline.', path: '/download' })
  const [apk, setApk] = useState<'checking' | 'yes' | 'no'>('checking')
  useEffect(() => {
    // Inside the store-installed app there is nothing to download: never probe for or offer the APK.
    if (isNative()) return
    let live = true
    fetch(SITE.apkUrl, { method: 'HEAD' })
      .then((r) => live && setApk(r.ok && !(r.headers.get('content-type') ?? '').includes('text/html') ? 'yes' : 'no'))
      .catch(() => live && setApk('no'))
    return () => { live = false }
  }, [])
  return (
    <ContentLayout eyebrow="Download" title="Get the app" intro="Use Invoice Studio as an app on Android, iPhone, Windows or Mac — it works offline and keeps your invoices on your device.">
      {isNative() ? <Card className="p-5"><p className="text-[15px]">You’re already using the Android app. 🎉</p></Card> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <Smartphone className="mb-3 size-7 text-primary" />
            <h2 className="text-lg font-semibold">Android app (APK)</h2>
            <p className="mt-1 text-sm text-muted">Download and install the APK directly on your Android phone.</p>
            {apk === 'yes' ? (
              <a href={SITE.apkUrl} download="invoice-studio.apk" className={`mt-4 ${buttonClass({ variant: 'primary' })}`}><Download className="size-4" aria-hidden />Download APK</a>
            ) : (
              <p className="mt-4 rounded-lg bg-canvas px-3 py-2 text-sm text-muted">{apk === 'checking' ? 'Checking availability…' : 'The APK isn’t published yet. Install the web app instead — it works the same way.'}</p>
            )}
            <div className="mt-4 text-xs text-muted">After downloading, open the file and allow “Install unknown apps” for your browser if Android asks.</div>
          </Card>
          <Card className="p-6">
            <MonitorSmartphone className="mb-3 size-7 text-primary" />
            <h2 className="text-lg font-semibold">Install from your browser</h2>
            <p className="mt-1 text-sm text-muted">No download needed. Works on Android, iPhone, Windows and Mac.</p>
            <UL items={[
              <><b>Android (Chrome):</b> menu ⋮ → Install app / Add to Home screen.</>,
              <><b>iPhone (Safari):</b> Share → Add to Home Screen.</>,
              <><b>Desktop (Chrome/Edge):</b> click the install icon in the address bar, or “Install app” in the header.</>,
            ]} />
          </Card>
        </div>
      )}
      <section>
        <H2>Why install?</H2>
        <UL items={['Opens full-screen like a native app', 'Works without an internet connection', 'Your invoices stay private on your device']} />
      </section>
    </ContentLayout>
  )
}
