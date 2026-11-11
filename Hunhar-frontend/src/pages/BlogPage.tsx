import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, CheckCircle2, Bell, Compass, Mail } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'
import lunaTypingImg from '../assets/FeaturesLuna.png'

export default function BlogPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return
    setIsSubscribed(true)
  }

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white select-text">
      {/* Sticky Adaptive Navbar matching Home, About, Features & Contact */}
      <Navbar onOpenSignup={() => setIsSignupModalOpen(true)} />

      <main className="flex-1 w-full">
        {/* Outer Navy Frame matching Home, About, Features & Contact Hero Sections */}
        <div className="p-2 sm:p-4 lg:p-5 bg-[#0A1B37]">
          <section className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white bg-[radial-gradient(circle,#E8DFC9_1.1px,transparent_1.1px)] [background-size:32px_32px] pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
            {/* Subtle Ambient Decorative Circles */}
            <div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] rounded-full bg-gradient-to-tr from-[#E2B48D]/15 via-[#FBE7D4]/30 to-transparent blur-3xl pointer-events-none -z-0"
              aria-hidden="true"
            />

            <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF0E8] border border-[#F1D1BD] text-[#C06B3E] font-manrope text-xs sm:text-sm font-bold mb-6 shadow-xs animate-pulse">
                <Sparkles className="w-4 h-4 text-[#C06B3E]" />
                <span>Luna is Writing • Blog Coming Soon</span>
              </div>

              {/* Headline */}
              <h1 className="font-makira font-medium text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[3.75rem] xl:text-[5rem] text-[#0A1B37] leading-[0.96] tracking-[-0.025em] uppercase m-0 max-w-3xl">
                Stories, Strategies & Tips{' '}
                <span className="block mt-2 bg-gradient-to-r from-[#C06B3E] via-[#D8783B] to-[#E39D52] bg-clip-text text-transparent">
                  Brewing Very Soon.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="font-manrope text-[0.9375rem] sm:text-base xl:text-[1.125rem] leading-[1.6] font-medium text-[#0A1B37]/85 max-w-2xl mt-6 mb-10">
                We&apos;re putting the finishing touches on inspiring student freelancer spotlights, client hiring playbooks, and platform updates. Luna is hard at work crafting our first editions!
              </p>

              {/* Mascot Centerpiece with Floating Category Chips - Fully spaced out so no badges overlap Luna */}
              <div className="relative w-full max-w-md sm:max-w-xl mx-auto mb-12 flex flex-col sm:flex-row items-center justify-center">
                {/* Warm Halo Behind Mascot */}
                <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#FBE7D4]/60 border-4 border-[#E2B48D]/30 shadow-2xl -z-0 blur-xs" />

                {/* Luna Image (completely clear of any overlapping badges) */}
                <img
                  src={lunaTypingImg}
                  alt="Luna typing on a laptop with a cup of coffee"
                  className="relative z-10 w-64 sm:w-72 lg:w-80 h-auto max-h-[380px] object-contain drop-shadow-xl select-none pointer-events-none hover:scale-105 transition-transform duration-500"
                />

                {/* Desktop Floating Badges (Safely positioned far outside the silhouette) */}
                {/* Floating Pill: Student Growth - far to the left */}
                <div className="hidden sm:flex absolute top-16 -left-4 lg:-left-12 z-20 px-4 py-2 rounded-full bg-white border border-[#E5E5E5] shadow-xl font-manrope text-xs font-bold text-[#0A1B37] items-center gap-2 -rotate-3 hover:rotate-0 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-terracotta" />
                  <span>🎓 Freelancer Playbooks</span>
                </div>

                {/* Floating Pill: Hiring Tips - far to the right, safely away from Luna's ear */}
                <div className="hidden sm:flex absolute top-16 -right-4 lg:-right-12 z-20 px-4 py-2 rounded-full bg-[#0A1B37] text-white shadow-xl font-manrope text-xs font-bold items-center gap-2 rotate-3 hover:rotate-0 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-gold" />
                  <span>💼 Founder Blueprints</span>
                </div>

                {/* Floating Pill: Campus Stories - far to the bottom left */}
                <div className="hidden sm:flex absolute -bottom-4 -left-2 lg:-left-8 z-20 px-4 py-2 rounded-full bg-[#FFF8EF] border border-[#E2B48D]/50 text-terracotta shadow-xl font-manrope text-xs font-bold items-center gap-2 rotate-2 hover:rotate-0 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-terracotta" />
                  <span>🚀 Campus Success Stories</span>
                </div>

                {/* Mobile Pill Row (cleanly beneath Luna so there's zero mobile collision) */}
                <div className="flex sm:hidden flex-wrap items-center justify-center gap-2 mt-4 z-20">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E5E5] text-[#0A1B37] text-xs font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    🎓 Freelancer Playbooks
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A1B37] text-white text-xs font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    💼 Founder Blueprints
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8EF] border border-[#E2B48D]/50 text-terracotta text-xs font-bold shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    🚀 Campus Stories
                  </span>
                </div>
              </div>

              {/* Notify Me Box */}
              <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-2xl p-3 sm:p-4 shadow-lg mb-10">
                {isSubscribed ? (
                  <div className="flex items-center justify-center gap-2.5 py-2 text-[#0A1B37] font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>You&apos;re on the list! We&apos;ll notify you when we launch. 🎉</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2.5 items-center">
                    <div className="relative w-full flex-1">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your email to get early access..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-black/10 bg-[#FAF7F2] text-sm text-[#0A1B37] placeholder:text-[#A1A1AA] outline-none focus:border-terracotta transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-terracotta hover:bg-[#A95A32] text-white font-manrope text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Notify Me</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Navigation Quick Links */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-[#555E6D]">
                <span>In the meantime, explore:</span>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-[#0A1B37] hover:text-terracotta transition-colors no-underline font-bold"
                >
                  <Compass className="w-4 h-4 text-terracotta" />
                  Home
                </Link>
                <span className="text-black/20">•</span>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-1 text-[#0A1B37] hover:text-terracotta transition-colors no-underline font-bold"
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                  Features
                </Link>
                <span className="text-black/20">•</span>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1 text-[#0A1B37] hover:text-terracotta transition-colors no-underline font-bold"
                >
                  <span>Contact Us</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Standard Footer */}
      <Footer onOpenSignup={() => setIsSignupModalOpen(true)} />

      {/* Global Signup Modal */}
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}
