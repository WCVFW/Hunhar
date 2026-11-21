import React, { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, Share2 } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'
import BlogCard from '../components/blog/BlogCard'
import { useBlogPost } from '../services/blogPosts'
import { renderArticleContent } from '../components/blog/articleContent'

/** Sets a <meta> tag (name= or property=) for this article and returns a function that removes it again. */
function setMeta(attr: 'name' | 'property', key: string, value: string) {
  const el = document.createElement('meta')
  el.setAttribute(attr, key)
  el.setAttribute('content', value)
  el.dataset.blog = 'true'
  document.head.appendChild(el)
}

export default function BlogPostPage(): React.JSX.Element {
  const { slug = '' } = useParams()
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)
  const { post, related, loading } = useBlogPost(slug)

  // SEO: title, description, Open Graph / Twitter cards and Article JSON-LD (same as the blog app)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (!post) return
    const previousTitle = document.title
    const title = post.metaTitle || `${post.title} | Hunhar Blog`
    const description = post.metaDescription || post.excerpt
    const url = `https://www.hunhar.in/blog/${post.slug}`
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'keywords', post.tags.join(', '))
    setMeta('property', 'og:type', 'article')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', post.coverImage)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', post.coverImage)
    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = url
    canonical.dataset.blog = 'true'
    document.head.appendChild(canonical)
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.dataset.blog = 'true'
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      image: [post.coverImage],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      author: [{ '@type': 'Person', name: post.author.name }],
      publisher: {
        '@type': 'Organization',
        name: 'Hunhar',
        url: 'https://www.hunhar.in',
        logo: { '@type': 'ImageObject', url: 'https://www.hunhar.in/favicon.svg' },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    })
    document.head.appendChild(ld)
    return () => {
      document.title = previousTitle
      document.head.querySelectorAll('[data-blog="true"]').forEach((el) => el.remove())
    }
  }, [post])

  if (!post && loading) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-[#0A1B37]">
        <Navbar onOpenSignup={() => setIsSignupModalOpen(true)} />
        <main className="flex-1 w-full p-2 sm:p-4 lg:p-5 2xl:p-6">
          <div className="w-full rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white pt-40 pb-40 text-center font-manrope text-sm text-slate-500">
            Loading article…
          </div>
        </main>
      </div>
    )
  }
  if (!post) return <Navigate to="/blog" replace />

  const relatedPosts = related

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white overflow-x-clip select-text">
      <Navbar onOpenSignup={() => setIsSignupModalOpen(true)} />
      <main className="flex-1 w-full">
      <div className="w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white select-text">

        {/* Outer Navy Frame */}
        <div className="p-2 sm:p-4 lg:p-5 2xl:p-6 bg-[#0A1B37]">
          <article className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white bg-[radial-gradient(circle,#E8DFC9_1.1px,transparent_1.1px)] [background-size:32px_32px] pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
            {/* Top Header / Breadcrumbs */}
            <div className="max-w-4xl mx-auto px-6 pt-4 pb-8">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-terracotta transition-colors mb-6 no-underline font-manrope"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Articles</span>
              </Link>

              {/* Category & Read Time */}
              <div className="flex flex-wrap items-center gap-3 mb-5 font-manrope">
                <span className="px-3 py-1 rounded-full bg-[#FFF2E8] border border-[#F6D0B8] text-terracotta text-xs font-bold tracking-wide">
                  {post.category}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-terracotta" />
                  {formattedDate}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-terracotta" />
                  {post.readTime}
                </span>
              </div>

              {/* Article Headline in Makira uppercase font */}
              <h1 className="font-makira font-medium text-3xl sm:text-4xl lg:text-5xl uppercase text-navy tracking-tight leading-[1.1] mb-6">
                {post.title}
              </h1>

              {/* Excerpt in Manrope font */}
              <p className="font-manrope text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
                {post.excerpt}
              </p>

              {/* Author Card & Share */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-black/[0.08] font-manrope">
                <div className="flex items-center gap-3">
                  <img
                    src="/favicon.png"
                    alt="Hunhar"
                    className="w-12 h-12 rounded-full object-contain border border-black/10 bg-white p-1.5"
                  />
                  <div>
                    <div className="font-bold text-sm text-navy">By Hunhar</div>
                    <div className="text-xs text-slate-500">SEO Team</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Share</span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(
                      `https://www.hunhar.in/blog/${post.slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Share on X"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Hero Cover Image */}
            <div className="max-w-4xl mx-auto px-6 mb-12">
              <div className="rounded-3xl overflow-hidden shadow-xl aspect-[16/9] max-h-[540px] w-full bg-slate-100">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Main Article Content */}
            <div className="max-w-4xl mx-auto px-6">
              <div className="prose-hunhar [&_blockquote]:not-italic [&_blockquote]:font-normal [&_em]:not-italic [&_em]:font-normal [&_i]:not-italic">
                {renderArticleContent(post.content)}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-6 border-t border-black/[0.08] flex flex-wrap items-center gap-2 font-manrope">
                  <span className="text-xs font-bold text-slate-400 uppercase mr-2">Tags:</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author Bio Box */}
              <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#F8FAFC] border border-slate-200/60 flex flex-col sm:flex-row items-center sm:items-start gap-5 font-manrope">
                <img
                  src="/favicon.png"
                  alt="Hunhar"
                  className="w-16 h-16 rounded-full object-contain border-2 border-white shadow-sm bg-white p-2"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-makira uppercase font-medium text-navy text-base mb-1">Written by Hunhar</h4>
                  <p className="text-xs font-medium text-terracotta mb-2">SEO Team</p>
                  <p className="text-sm text-slate-600 leading-relaxed font-manrope">
                    Contributing actionable strategies, guides, and hiring tips for the next generation of creative builders on Hunhar.
                  </p>
                </div>
              </div>

              {/* Call to Action Box */}
              <div className="mt-14 rounded-3xl bg-gradient-to-br from-[#0A1B37] to-[#122b54] p-8 sm:p-10 text-white shadow-xl text-center relative overflow-hidden">
                <h3 className="font-makira font-medium text-2xl sm:text-3xl uppercase tracking-wide mb-3">
                  Ready to Connect with Top Creative Talent?
                </h3>
                <p className="font-manrope text-white/80 text-sm sm:text-base max-w-lg mx-auto mb-6">
                  Post your project in under 2 minutes, get competitive bids from verified students, and pay only when satisfied through milestone escrow.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 font-manrope">
                  <a
                    href="/signup?role=client"
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-bold text-sm hover:brightness-105 shadow-md transition-all no-underline"
                  >
                    Post a Project
                  </a>
                  <a
                    href="/signup?role=freelancer"
                    className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all no-underline"
                  >
                    Start Earning as Talent
                  </a>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <section className="max-w-7xl 2xl:max-w-[110rem] mx-auto px-6 sm:px-8 2xl:px-12 mt-20 pt-16 border-t border-black/[0.08]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-makira font-medium text-2xl sm:text-3xl uppercase tracking-wide text-navy">
                    More Insights from Hunhar
                  </h2>
                  <Link to="/blog" className="text-sm font-bold text-terracotta hover:underline font-manrope">
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {relatedPosts.map((rPost) => (
                    <BlogCard key={rPost.id} post={rPost} />
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </div>
      </main>
      <Footer onOpenSignup={() => setIsSignupModalOpen(true)} />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}
