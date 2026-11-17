import { ContentLayout, H2, P, UL } from './ContentLayout'
import { useSeo } from '@/hooks/useSeo'
import { SITE } from '@/config/site'

export default function PrivacyPage() {
  useSeo({ title: 'Privacy Policy', description: 'Invoice Studio stores your invoices only on your device. No account, no tracking of invoice data, and no data sent to our servers.', path: '/privacy' })
  return (
    <ContentLayout eyebrow="Legal" title="Privacy policy" intro={`Last updated ${SITE.lastUpdated}.`} cta={false}>
      <section>
        <H2>Summary</H2>
        <P>Invoice Studio is designed so that we never receive your invoices. Everything you type — business details, customers, line items, bank details and logos — stays in your browser on your device.</P>
      </section>
      <section>
        <H2>What is stored and where</H2>
        <UL items={[
          'Invoices, drafts, business profiles, logos and settings are saved in your browser’s local database (IndexedDB) on this device.',
          'This data is not uploaded, shared or synchronised to any server operated by us or third parties.',
          'A small preference (whether you have seen the product tour) is stored in your browser’s local storage.',
          'CSV and JSON files you import are read and processed on your device and are not uploaded.',
          'PDFs, ZIP files and backups are generated on your device and saved to your downloads.',
        ]} />
      </section>
      <section>
        <H2>What we do not do</H2>
        <UL items={['No account or registration.', 'No advertising or analytics on invoice or customer data.', 'No sale of personal information.']} />
      </section>
      <section>
        <H2>Website hosting</H2>
        <P>When you load the website, the hosting provider serving the files may record standard technical logs (such as IP address, browser type and time of request) for security and reliability. These logs do not contain your invoice data.</P>
      </section>
      <section>
        <H2>Your control</H2>
        <UL items={[
          'Export all data as a JSON backup from Settings → Your data.',
          'Delete everything at any time with Settings → Delete all data, or by clearing this site’s data in your browser.',
          'Because data lives only on your device, we cannot recover it for you if it is deleted.',
        ]} />
      </section>
      <section>
        <H2>Android app</H2>
        <P>The Android app stores data inside the app on your phone. When you export a PDF, the app writes it to its own storage and opens the system share sheet so you can choose where to save or send it. It requests no storage permissions.</P>
      </section>
      <section>
        <H2>Contact</H2>
        <P>Questions about privacy? Email <a className="text-primary" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</P>
      </section>
    </ContentLayout>
  )
}
