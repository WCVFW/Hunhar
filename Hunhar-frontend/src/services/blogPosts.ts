// Blog articles come from the server (written in the blog dashboard). The bundled copy of the original
// Hunhar-blog posts is only a fallback when the API cannot be reached.
import { useEffect, useState } from 'react'
import rawPosts from '../content/blogPosts.json'
import type { BlogPost } from '../types/blog'
import { blogApi, fileUrl } from './api'

const bundled = (rawPosts as BlogPost[])
  .filter((p) => p.status === 'published')
  .map(withUrls)
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

/** Uploaded images are stored as /api/v1/projects/files/... paths: make them full URLs. */
function withUrls(p: BlogPost): BlogPost {
  return {
    ...p,
    tags: p.tags || [],
    coverImage: fileUrl(p.coverImage) || p.coverImage,
    author: {
      name: 'Hunhar',
      role: 'SEO Team',
      avatar: '/Hunhar_Blog_profile.png',
    },
  }
}

let cache: BlogPost[] | null = null

export function invalidateBlogCache() {
  cache = null
}

async function loadAll(): Promise<BlogPost[]> {
  try {
    cache = (await blogApi.posts()).map(withUrls)
  } catch {
    cache = cache || bundled
  }
  return cache
}

/** Published articles, newest first. */
export function useBlogPosts(): { posts: BlogPost[]; loading: boolean } {
  const [posts, setPosts] = useState<BlogPost[]>(cache || [])
  const [loading, setLoading] = useState(!cache)
  useEffect(() => {
    let alive = true
    loadAll().then((list) => {
      if (alive) {
        setPosts(list)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])
  return { posts, loading }
}

/** One published article by its URL slug (null = not found), plus the other articles for "More Insights". */
export function useBlogPost(slug: string): { post: BlogPost | null; related: BlogPost[]; loading: boolean } {
  const [post, setPost] = useState<BlogPost | null>(() => cache?.find((p) => p.slug === slug) || null)
  const [related, setRelated] = useState<BlogPost[]>(cache || [])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      blogApi.post(slug).then(withUrls).catch(() => bundled.find((p) => p.slug === slug) || null),
      loadAll(),
    ]).then(([found, all]) => {
      if (!alive) return
      setPost(found)
      setRelated(all.filter((p) => p.slug !== slug).slice(0, 3))
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [slug])
  return { post, related, loading }
}
