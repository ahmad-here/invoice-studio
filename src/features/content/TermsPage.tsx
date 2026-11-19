import { ContentLayout, H2, P, UL } from './ContentLayout'
import { useSeo } from '@/hooks/useSeo'
import { SITE } from '@/config/site'

export default function TermsPage() {
  useSeo({ title: 'Terms of Service', description: 'Terms of service for Invoice Studio, the free online and offline invoice generator.', path: '/terms' })
  return (
    <ContentLayout eyebrow="Legal" title="Terms of service" intro={`Last updated ${SITE.lastUpdated}.`} cta={false}>
      <section><H2>1. The service</H2><P>Invoice Studio (“the app”) is a free tool for creating, printing and exporting invoices. It runs in your browser or as an installed app and stores your data on your device only.</P></section>
      <section><H2>2. Your responsibilities</H2><UL items={[
        'You are responsible for the accuracy of the invoices you create, including tax rates, amounts, legal wording and any information required in your country.',
        'Invoice Studio does not provide tax, legal or accounting advice. Check requirements with a qualified professional.',
        'Do not use the app to create fraudulent, misleading or unlawful documents.',
      ]} /></section>
      <section><H2>3. Your data</H2><P>Your invoices, clients, business profiles and settings are stored locally on your device and are never uploaded to us. You are responsible for keeping backups (Settings → Export backup). We cannot recover data that is deleted from your device or browser.</P></section>
      <section><H2>4. Availability</H2><P>The app is provided “as is” without warranties of any kind. We may change, improve or discontinue features at any time. Because the app works offline, previously installed versions continue to work on your device.</P></section>
      <section><H2>5. Limitation of liability</H2><P>To the maximum extent permitted by law, we are not liable for any indirect, incidental or consequential damages, or for loss of data, revenue or profits, arising from your use of the app.</P></section>
      <section><H2>6. Changes to these terms</H2><P>We may update these terms. The “last updated” date above shows when they last changed. Continued use after a change means you accept the updated terms.</P></section>
      <section><H2>7. Contact</H2><P>Questions about these terms? Email <a className="text-primary" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</P></section>
    </ContentLayout>
  )
}
