// Blog articles (same content as the Hunhar-blog project's content/posts.json). Only published posts are shown.
import rawPosts from '../content/blogPosts.json'
import type { BlogPost } from '../types/blog'

const posts = (rawPosts as BlogPost[])
  .filter((p) => p.status === 'published')
  .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

export const getAllPosts = (): BlogPost[] => posts

export const getPostBySlug = (slug: string): BlogPost | null => posts.find((p) => p.slug === slug) || null
