import React, { useState, useEffect } from 'react'
import { ArrowRight, BookOpen, Clock, Tag, Search, Sparkles } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  readTime: string
  date: string
  author: {
    name: string
    role: string
  }
}

const categories = ['All', 'Freelancing', 'Student Growth', 'Hiring Tips', 'AI & Tech', 'Success Stories']

const blogPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'How College Students are Earning ₹50,000+/Month on Hunhar',
    excerpt: 'A comprehensive guide on packaging academic skills into high-demand freelance offerings and winning verified client contracts.',
    category: 'Freelancing',
    readTime: '5 min read',
    date: 'Nov 8, 2026',
    author: { name: 'Vikash Kumar', role: 'Top Student Freelancer' },
  },
  {
    id: 'post-2',
    title: 'Why Startups Prefer Hiring Skilled Students Over Agencies',
    excerpt: 'Agile startups share why verified student talent delivers faster turnarounds, fresh creative perspectives, and higher ROI.',
    category: 'Hiring Tips',
    readTime: '4 min read',
    date: 'Nov 5, 2026',
    author: { name: 'Pooja Mehta', role: 'Head of Talent Partnerships' },
  },
  {
    id: 'post-3',
    title: 'Balancing College Academics with Client Projects',
    excerpt: 'Time-management systems and milestone tracking frameworks that keep GPA high while growing your professional portfolio.',
    category: 'Student Growth',
    readTime: '6 min read',
    date: 'Oct 30, 2026',
    author: { name: 'Ananya Sharma', role: 'Student Ambassador' },
  },
  {
    id: 'post-4',
    title: 'Building an Unbeatable UI/UX Portfolio with Real Wins',
    excerpt: 'Why stock mockups fail to impress clients and how showcasing verified deliverables builds instant buyer belief.',
    category: 'Freelancing',
    readTime: '4 min read',
    date: 'Oct 24, 2026',
    author: { name: 'Rihana', role: 'Product Designer' },
  },
  {
    id: 'post-5',
    title: 'How Hunhar AI Protects Milestones and Escrow Payments',
    excerpt: 'An inside look at how automated quality checks and milestones ensure zero disputes between businesses and talent.',
    category: 'AI & Tech',
    readTime: '5 min read',
    date: 'Oct 18, 2026',
    author: { name: 'Hunhar Engineering', role: 'Platform Tech' },
  },
  {
    id: 'post-6',
    title: 'From Campus Fresher to Full-Time Product Engineer',
    excerpt: 'How one student turned 3 milestone projects on Hunhar into a pre-placement offer before final semester exams.',
    category: 'Success Stories',
    readTime: '7 min read',
    date: 'Oct 12, 2026',
    author: { name: 'Karthik Raja', role: 'Alumni Contributor' },
  },
]

export default function BlogPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] text-navy selection:bg-terracotta selection:text-white">
      {/* Sticky Header / Navbar */}
      <Navbar onOpenSignup={() => setIsSignupModalOpen(true)} />

      <main className="flex-1 w-full">
        {/* Curved Hero Section matching Home & Features pages */}
        <div className="p-2 sm:p-4 lg:p-5 bg-[#0A1B37]">
          <section className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white bg-[radial-gradient(circle,#E8DFC9_1.1px,transparent_1.1px)] [background-size:32px_32px] pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
            <div className="relative max-w-5xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0E8] border border-[#F1D1BD] text-[#C06B3E] font-manrope text-xs sm:text-[13px] font-semibold mb-6 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#C06B3E]" />
                <span>Hunhar Insights & Knowledge Hub</span>
              </div>

              {/* Title */}
              <h1 className="font-makira font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#0A1B37] leading-[1.08] tracking-[-0.02em] m-0 max-w-3xl">
                Stories, Strategies & Tips for{' '}
                <span className="bg-gradient-to-r from-[#C06B3E] via-[#D8783B] to-[#E39D52] bg-clip-text text-transparent">
                  Students & Businesses
                </span>
              </h1>

              {/* Subhead */}
              <p className="font-manrope text-[15px] sm:text-base lg:text-[17px] text-[#555E6D] leading-[1.65] font-normal max-w-2xl mt-5 mb-8">
                Learn how ambitious students build real professional proof, earn independently, and help high-growth businesses succeed.
              </p>

              {/* Search Bar */}
              <div className="w-full max-w-md relative mb-8">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search articles, topics or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-black/10 bg-white shadow-sm font-manrope text-sm text-[#0A1B37] placeholder:text-[#A1A1AA] outline-none focus:border-[#C06B3E] transition-colors"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`font-manrope text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#0A1B37] text-white shadow-xs'
                        : 'bg-white border border-black/10 text-[#555E6D] hover:border-black/25 hover:text-[#0A1B37]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Blog Posts Grid Section */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
              <h3 className="font-makira text-xl font-bold text-[#0A1B37] mb-2">No articles found</h3>
              <p className="font-manrope text-sm text-[#71717A]">
                Try adjusting your search query or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col bg-white border border-[#E5E5E5]/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Category & Read Time */}
                  <div className="flex items-center justify-between text-xs font-semibold mb-4">
                    <span className="inline-flex items-center gap-1.5 text-[#C06B3E] bg-[#FAF0E8] px-2.5 py-1 rounded-full">
                      <Tag className="w-3 h-3" />
                      {post.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#71717A] font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-makira font-bold text-lg text-[#0A1B37] group-hover:text-[#C06B3E] transition-colors mb-3 leading-snug">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="font-manrope text-sm text-[#555E6D] leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>

                  {/* Author & Date Footer */}
                  <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#71717A]">
                    <div>
                      <span className="font-semibold text-[#0A1B37] block">{post.author.name}</span>
                      <span className="text-[11px]">{post.author.role}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[#C06B3E] font-semibold group-hover:translate-x-0.5 transition-transform">
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer onOpenSignup={() => setIsSignupModalOpen(true)} />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}

