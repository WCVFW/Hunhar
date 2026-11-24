import React, { useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'
import BlogList from '../components/blog/BlogList'
import { useBlogPosts } from '../services/blogPosts'
import { setPageCanonical, setMetaTag, resetBlogMetaTags, BASE_SITE_URL } from '../services/seo'

const SUBSCRIBE_EMAIL = 'howdy@theunoia.com'

export default function BlogPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)
  const { posts, loading } = useBlogPosts()

  useEffect(() => {
    document.title = 'Hunhar Blog — Creative Freelance Marketplace & Growth Insights'
    setPageCanonical(`${BASE_SITE_URL}/blog`)
    setMetaTag(
      'name',
      'description',
      'Explore actionable guides, freelancing strategies, student career tips, and creative hiring insights on the Hunhar Blog.'
    )
    window.scrollTo(0, 0)

    return () => {
      resetBlogMetaTags()
    }
  }, [])

  const subscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') || '').trim()
    window.location.href = `mailto:${SUBSCRIBE_EMAIL}?subject=${encodeURIComponent('Subscribe me to Hunhar guides')}&body=${encodeURIComponent(
      `Please add ${email} to the Hunhar weekly guides.`
    )}`
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white overflow-x-clip select-text">
      <Navbar onOpenSignup={() => setIsSignupModalOpen(true)} />
      <main className="flex-1 w-full">
      <div className="w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white select-text">
        {/* Outer Navy Frame matching Home, About, Features & Contact Hero Sections */}
        <div className="p-2 sm:p-4 lg:p-5 2xl:p-6 bg-[#0A1B37]">
          <section className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white bg-[radial-gradient(circle,#E8DFC9_1.1px,transparent_1.1px)] [background-size:32px_32px] pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 lg:pb-24">
            {/* Subtle Ambient Decorative Circles */}
            <div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] rounded-full bg-gradient-to-tr from-[#E2B48D]/15 via-[#FBE7D4]/30 to-transparent blur-3xl pointer-events-none -z-0"
              aria-hidden="true"
            />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-7xl 2xl:max-w-[110rem] mx-auto px-6 sm:px-8 2xl:px-12">
              {loading ? (
                <p className="py-16 text-center font-manrope text-sm text-slate-500">Loading articles…</p>
              ) : (
                <BlogList initialPosts={posts} />
              )}
            </div>

            {/* Newsletter / CTA Section */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 mt-20">
              <div className="relative rounded-3xl bg-[#08182B] text-white p-8 sm:p-12 overflow-hidden shadow-2xl text-center">
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1.2px, transparent 1.2px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative z-10 max-w-2xl mx-auto">
                  <span className="text-xs uppercase font-bold tracking-widest text-[#CBA96B] mb-3 block">
                    Stay Connected
                  </span>
                  <h3 className="font-makira font-medium text-2xl sm:text-3xl uppercase tracking-wide mb-3">
                    Get Curated Guides Weekly
                  </h3>
                  <p className="font-manrope text-white/70 text-sm sm:text-base mb-8">
                    Join thousands of creatives and founders receiving our latest playbooks.
                  </p>

                  <form
                    onSubmit={subscribe}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
                  >
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      required
                      className="w-full sm:w-auto flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-7 py-3 rounded-full bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-bold text-sm hover:brightness-105 shadow-md transition-all cursor-pointer font-manrope"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      </main>
      <Footer onOpenSignup={() => setIsSignupModalOpen(true)} />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}
