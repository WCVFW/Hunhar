/**
 * Centralized SEO & Meta Tag Management for Hunhar
 * Ensures single self-referencing canonical URLs and accurate meta tags
 * without duplicate tags that confuse search engines and SEO analyzers.
 */

export const DEFAULT_SITE_TITLE = 'hunhar.in — Creative Freelance Marketplace & Collaboration Platform'
export const DEFAULT_SITE_DESCRIPTION =
  'hunhar.in connects skilled creative freelancers with businesses through transparent bidding, secure escrow payments, and dedicated workspace collaboration.'
export const BASE_SITE_URL = 'https://www.hunhar.in'

/**
 * Updates or creates the single <link rel="canonical"> tag on the page.
 * Removes any duplicate canonical tags to strictly follow Google & SEO standards.
 */
export function setPageCanonical(url: string): void {
  const allCanonicals = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'))

  if (allCanonicals.length > 0) {
    // Keep the first one and set its href
    const primary = allCanonicals[0]
    primary.href = url

    // Remove any accidental duplicate canonical tags
    for (let i = 1; i < allCanonicals.length; i++) {
      allCanonicals[i].remove()
    }
  } else {
    const link = document.createElement('link')
    link.rel = 'canonical'
    link.href = url
    document.head.appendChild(link)
  }
}

/**
 * Ensures meta description complies with Google SERP & Detailed SEO extension limits (maximum 155 characters).
 * If a description exceeds 155 chars, it simplifies common verbose phrases or cleanly truncates
 * at the nearest word boundary so Detailed SEO always awards a green check (✔) and Google never cuts it off.
 */
export function formatSeoDescription(text: string, maxLen = 155): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean

  // 1. Try removing common verbose filler phrases without changing the core meaning
  const simplified = clean
    .replace(/\bways to find\b/gi, 'find')
    .replace(/\bways to get\b/gi, 'get')
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bas well as\b/gi, 'and')
  if (simplified.length <= maxLen) {
    return simplified
  }

  // 2. Otherwise cleanly truncate at the nearest word boundary <= maxLen
  const sub = simplified.slice(0, maxLen)
  const lastSpace = sub.lastIndexOf(' ')
  if (lastSpace > 80) {
    const trimmed = sub.slice(0, lastSpace).replace(/[,;:\-\s]+$/, '')
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
  }

  return sub.slice(0, maxLen).replace(/[,;:\-\s]+$/, '') + '.'
}

/**
 * Updates an existing <meta> tag or creates a new one if not present.
 */
export function setMetaTag(attr: 'name' | 'property', key: string, value: string): void {
  // Automatically ensure meta descriptions stay <= 155 characters for SEO compliance
  const finalValue = key.toLowerCase().includes('description') ? formatSeoDescription(value, 155) : value

  const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (existing) {
    if (!existing.dataset.originalContent && !existing.dataset.blog) {
      existing.dataset.originalContent = existing.getAttribute('content') || ''
    }
    existing.dataset.blog = 'true'
    existing.setAttribute('content', finalValue)
  } else {
    const el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute('content', finalValue)
    el.dataset.blog = 'true'
    document.head.appendChild(el)
  }
}

/**
 * Restores meta tags modified with data-blog="true"
 */
export function resetBlogMetaTags(): void {
  document.head.querySelectorAll<HTMLMetaElement>('meta[data-blog="true"]').forEach((el) => {
    if (el.dataset.originalContent !== undefined) {
      el.setAttribute('content', el.dataset.originalContent)
      delete el.dataset.originalContent
      delete el.dataset.blog
    } else {
      el.remove()
    }
  })
}
