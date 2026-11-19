import { PageHeader } from '@/components/common/ui'
import { useSeo } from '@/hooks/useSeo'
import { BusinessProfiles } from './BusinessProfiles'

/** My Business: add your business (logo, contact and tax details) once; every invoice uses it. */
export default function BusinessPage() {
  useSeo({ title: 'My business', description: 'Your business profiles.', path: '/business', noindex: true })
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My business" description="Add your business details once — logo, address and tax numbers. They're filled in automatically on every new invoice. Payment details are managed in Settings → Payment methods." />
      <BusinessProfiles />
    </div>
  )
}
