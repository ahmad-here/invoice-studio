import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/common/ui'
import { isNative } from '@/services/files'
import { APP_MODE } from '@/lib/appMode'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Shows "Install app" only when the browser offers a PWA install prompt. */
export function InstallButton() {
  const [evt, setEvt] = useState<BIPEvent | null>(null)
  useEffect(() => {
    if (isNative() || APP_MODE) return
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent) }
    const done = () => setEvt(null)
    window.addEventListener('beforeinstallprompt', on)
    window.addEventListener('appinstalled', done)
    return () => { window.removeEventListener('beforeinstallprompt', on); window.removeEventListener('appinstalled', done) }
  }, [])
  if (!evt) return null
  return (
    <Button size="sm" variant="secondary" icon={<Download className="size-4" />} onClick={async () => { await evt.prompt(); await evt.userChoice; setEvt(null) }}>
      Install app
    </Button>
  )
}
