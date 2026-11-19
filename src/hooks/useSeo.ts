import { useEffect } from 'react'
import { SITE } from '@/config/site'

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
}

/** Human labels for breadcrumb trails. */
const CRUMBS: Record<string, string> = {
  '/features': 'Features', '/how-to-use': 'How to use', '/faq': 'FAQ', '/support': 'Support', '/contact': 'Contact',
  '/privacy': 'Privacy policy', '/terms': 'Terms of service', '/download': 'Download app', '/templates': 'Invoice templates',
  '/bulk': 'Bulk invoice generator', '/create': 'Create invoice',
}

/**
 * Per-route title, description, canonical, Open Graph/Twitter tags, robots and JSON-LD
 * (BreadcrumbList is added automatically for inner pages). Prerendering bakes these into static HTML.
 */
export function useSeo({ title, description, path, jsonLd, noindex }: { title: string; description: string; path: string; jsonLd?: object; noindex?: boolean }) {
  useEffect(() => {
    const full = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`
    const url = SITE.url + path
    document.title = full
    meta('name', 'description', description)
    meta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large')
    meta('property', 'og:type', 'website')
    meta('property', 'og:site_name', SITE.name)
    meta('property', 'og:title', full)
    meta('property', 'og:description', description)
    meta('property', 'og:url', url)
    meta('property', 'og:image', `${SITE.url}/og-image.png`)
    meta('property', 'og:image:width', '1200')
    meta('property', 'og:image:height', '630')
    meta('name', 'twitter:card', 'summary_large_image')
    meta('name', 'twitter:title', full)
    meta('name', 'twitter:description', description)
    meta('name', 'twitter:image', `${SITE.url}/og-image.png`)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = url

    const graph: object[] = []
    if (jsonLd) graph.push(jsonLd)
    if (path !== '/' && CRUMBS[path]) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: CRUMBS[path], item: url },
        ],
      })
    }
    document.getElementById('route-jsonld')?.remove()
    if (graph.length) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.id = 'route-jsonld'
      s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph.map((g) => { const { ['@context']: _c, ...rest } = g as Record<string, unknown>; void _c; return rest }) })
      document.head.appendChild(s)
    }
  }, [title, description, path, jsonLd, noindex])
}
