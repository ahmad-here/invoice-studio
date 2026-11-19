import { Link } from 'react-router-dom'
import { FilePlus2 } from 'lucide-react'
import { PageHeader, buttonClass } from '@/components/common/ui'
import { useApp } from '@/app/store'
import { useSeo } from '@/hooks/useSeo'
import { BusinessProfiles } from './BusinessProfiles'

/** My Business: add your business (logo, contact, tax and bank details) once; every invoice uses it. */
export default function BusinessPage() {
  useSeo({ title: 'My business', description: 'Your business profiles and payment details.', path: '/business', noindex: true })
  const count = useApp((s) => s.businesses.length)
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My business" description="Add your business details once — logo, address, tax numbers and bank details. They're filled in automatically on every new invoice."
        actions={count > 0 ? <Link to="/create" className={buttonClass({ variant: 'primary' })}><FilePlus2 className="size-4" aria-hidden />Create invoice</Link> : undefined} />
      <BusinessProfiles />
    </div>
  )
}
