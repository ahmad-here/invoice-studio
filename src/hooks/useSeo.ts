import { useEffect } from 'react'
import { SITE } from '@/config/site'

function meta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.content = content
}

/** Per-route title, description, canonical URL and optional JSON-LD (kept in the prerendered HTML). */
export function useSeo({ title, description, path, jsonLd, noindex }: { title: string; description: string; path: string; jsonLd?: object; noindex?: boolean }) {
  useEffect(() => {
    const full = title.includes(SITE.name) ? title : `${title} | ${SITE.name}`
    document.title = full
    meta('name', 'description', description)
    meta('property', 'og:title', full)
    meta('property', 'og:description', description)
    meta('property', 'og:url', SITE.url + path)
    meta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = SITE.url + path
    document.getElementById('route-jsonld')?.remove()
    if (jsonLd) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.id = 'route-jsonld'
      s.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(s)
    }
  }, [title, description, path, jsonLd, noindex])
}
