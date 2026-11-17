import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { ContentLayout, P } from './ContentLayout'
import { Button, Card, Input, Select, Textarea } from '@/components/common/ui'
import { useSeo } from '@/hooks/useSeo'
import { SITE } from '@/config/site'

/** Contact without a backend: composes an email in the user's mail app; nothing is sent from this site. */
export default function ContactPage() {
  useSeo({ title: 'Contact Us', description: 'Contact the Invoice Studio team for support, feedback or feature requests.', path: '/contact' })
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('Support')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 10) { setError('Please write a short message (at least 10 characters).'); return }
    setError(null)
    const subject = `[${topic}] Invoice Studio`
    const body = `${message.trim()}\n\n— ${name.trim() || 'Invoice Studio user'}`
    window.location.href = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }
  return (
    <ContentLayout eyebrow="Contact" title="Get in touch" intro="Questions, feedback or a feature idea? We read every message." cta={false}>
      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Input label="Your name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <Select label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option>Support</option><option>Bug report</option><option>Feature request</option><option>Feedback</option><option>Other</option>
            </Select>
            <Textarea label="Message" required rows={6} maxLength={4000} value={message} error={error} onChange={(e) => setMessage(e.target.value)} />
            <Button type="submit" variant="primary" icon={<Send className="size-4" />}>Open in email app</Button>
            <p className="text-xs text-muted">This opens your email app with the message ready to send. Please don’t include invoice or bank details.</p>
          </form>
        </Card>
        <div>
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Mail className="size-5 text-primary" />Email</div>
          <a href={`mailto:${SITE.supportEmail}`} className="mt-1 block break-all text-primary hover:text-primary-700">{SITE.supportEmail}</a>
          <div className="mt-6"><P>We usually reply within two business days. For quick answers, check the FAQ and Support pages.</P></div>
        </div>
      </div>
    </ContentLayout>
  )
}
