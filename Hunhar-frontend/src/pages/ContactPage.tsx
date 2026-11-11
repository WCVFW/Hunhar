import React, { useState, useEffect } from 'react'
import { Mail, MapPin, Clock, Send, MessageSquare, CheckCircle, Sparkles } from 'lucide-react'
import { FaInstagram, FaLinkedinIn, FaYoutube, FaXTwitter, FaFacebookF } from 'react-icons/fa6'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'

import wolfJarImg from '../assets/about/wolf_jar.webp'
import vikashImg from '../assets/about/vikash_arch.jpg'
import rihanaImg from '../assets/about/rihana_arch.jpg'
import meeraImg from '../assets/about/meera_arch.jpg'
import mascotLaptopImg from '../assets/image.png'
import mascotBusinessImg from '../assets/mascot_business.png'

export default function ContactPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)
  const [activeRole, setActiveRole] = useState<'student' | 'business'>('student')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skill: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState<boolean>(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white select-text">
      {/* Header / Navbar */}
      <Navbar onOpenSignup={() => setIsSignupModalOpen(true)} />

      <main className="flex-1 w-full select-text">
        {/* HERO SECTION - CONTACT */}
        <div className="p-3 sm:p-4 lg:p-5 bg-[#0A1B37]">
          <section className="relative rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-[#ffffff] text-navy overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24 px-6 sm:px-10 lg:px-14 bg-[radial-gradient(rgba(10,27,55,0.08)_1.1px,transparent_1.2px)] [background-size:36px_36px] select-text">
            <style>{`
              @keyframes orbitClockwise {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
              }
              @keyframes orbitCounterClockwise {
                from { transform: translate(-50%, -50%) rotate(360deg); }
                to { transform: translate(-50%, -50%) rotate(0deg); }
              }
              @keyframes counterRotateClockwise {
                from { transform: rotate(0deg); }
                to { transform: rotate(-360deg); }
              }
              @keyframes counterRotateCounterClockwise {
                from { transform: rotate(-360deg); }
                to { transform: rotate(0deg); }
              }
            `}</style>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading, Subhead, CTA, Email & Hours */}
              <div className="flex flex-col items-start lg:col-span-6 z-10 select-text">
                <span className="inline-block px-4 py-1.5 rounded-full bg-[#0A1B37] text-[#D89B6A] font-manrope font-bold text-xs sm:text-sm tracking-wide shadow-sm select-text">
                  Contact Hunhar
                </span>

                <h1 className="font-makira font-medium text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[3.75rem] xl:text-[5rem] text-navy tracking-[-0.025em] leading-[0.96] uppercase mt-5 mb-5 select-text">
                  <span className="block whitespace-nowrap select-text">Let’s Talk Talent &amp;</span>
                  <span className="block text-terracotta whitespace-nowrap select-text">Opportunity.</span>
                </h1>

                <p className="font-manrope text-[0.9375rem] sm:text-base xl:text-[1.125rem] leading-[1.6] font-medium text-[#0A1B37]/85 max-w-md mb-8 select-text">
                  Have a question, an idea or feedback? Tell us how we can help. We read every message and reply by email.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mb-10">
                  <a
                    href="#contact-form"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-terracotta hover:bg-[#AA572D] text-[#FFF8EF] font-manrope font-bold text-base transition-transform duration-200 hover:-translate-y-0.5 shadow-lg shadow-terracotta/25 cursor-pointer"
                  >
                    Send a Message <span aria-hidden="true">&darr;</span>
                  </a>
                  <a
                    href="mailto:hello@hunhar.com"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-transparent hover:bg-black/5 text-navy font-manrope font-bold text-base border border-navy/30 transition-colors"
                  >
                    Email Us
                  </a>
                </div>

                <div className="flex flex-wrap items-start gap-8 sm:gap-14 pt-4 border-t border-navy/15 w-full max-w-lg select-text">
                  <div>
                    <span className="block text-xs font-semibold text-navy/60 mb-1 select-text">Email</span>
                    <a
                      href="mailto:hello@hunhar.com"
                      className="font-manrope font-bold text-sm sm:text-base text-navy hover:text-terracotta transition-colors select-text"
                    >
                      hello@hunhar.com
                    </a>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-navy/60 mb-1 select-text">Support hours</span>
                    <span className="font-manrope font-bold text-sm sm:text-base text-navy select-text">
                      Mon to Sat, 10 am to 6 pm
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Center Mascot + Concentric Orbiting Tracks */}
              <div className="lg:col-span-6 relative w-full h-[500px] sm:h-[540px] lg:h-[600px] flex items-center justify-center select-text overflow-visible">
                {/* Center Mascot Circle with Warm Glow */}
                <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full border-4 border-[#E2B48D] bg-[#FBE7D4]/50 shadow-2xl flex items-center justify-center p-2 backdrop-blur-xs">
                  <img
                    src={wolfJarImg}
                    alt="Hunhar Mascot winking and giving thumbs up"
                    className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
                  />
                </div>

                {/* Orbit 1: Inner Track (Clockwise) */}
                <div
                  className="absolute top-1/2 left-1/2 rounded-full border border-dashed border-[#0A1B37]/30 pointer-events-none will-change-transform w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] lg:w-[320px] lg:h-[320px]"
                  style={{ animation: 'orbitClockwise 48s linear infinite' }}
                >
                  {/* Talent Pill Badge (at ~3 o'clock) */}
                  <div
                    className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <span className="inline-block px-3.5 py-1.5 rounded-full bg-terracotta text-white font-manrope font-bold text-xs shadow-md whitespace-nowrap">
                      Talent
                    </span>
                  </div>
                </div>

                {/* Orbit 2: Middle Track (Clockwise) */}
                <div
                  className="absolute top-1/2 left-1/2 rounded-full border border-dashed border-[#0A1B37]/25 pointer-events-none will-change-transform w-[420px] h-[420px] sm:w-[440px] sm:h-[440px] lg:w-[460px] lg:h-[460px]"
                  style={{ animation: 'orbitClockwise 48s linear infinite' }}
                >
                  {/* Opportunity Pill Badge (at ~12:30 o'clock) */}
                  <div
                    className="absolute top-[4%] right-[28%] translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[#0A1B37] text-white font-manrope font-bold text-xs shadow-md whitespace-nowrap">
                      Opportunity
                    </span>
                  </div>

                  {/* Student Avatar: Vikash (at ~11 o'clock - Enriched Large Avatar) */}
                  <div
                    className="absolute top-[14%] left-[16%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <div className="w-18 h-18 sm:w-20 sm:h-20 lg:w-[5.25rem] lg:h-[5.25rem] rounded-full border-4 border-white shadow-2xl bg-white overflow-hidden flex items-center justify-center transition-transform hover:scale-110">
                      <img
                        src={vikashImg}
                        alt="Vikash Kumar"
                        className="w-full h-full object-cover object-top scale-130 origin-top select-none pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Student Avatar: Rihana (at ~5 o'clock - Enriched Large Avatar) */}
                  <div
                    className="absolute bottom-[16%] right-[16%] translate-x-1/2 translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <div className="w-18 h-18 sm:w-20 sm:h-20 lg:w-[5.25rem] lg:h-[5.25rem] rounded-full border-4 border-white shadow-2xl bg-white overflow-hidden flex items-center justify-center transition-transform hover:scale-110">
                      <img
                        src={rihanaImg}
                        alt="Rihana"
                        className="w-full h-full object-cover object-top scale-135 origin-top select-none pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Gold Mini Planet Dot (at ~7 o'clock) */}
                  <div
                    className="absolute bottom-[18%] left-[24%] -translate-x-1/2 translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#CDA96B] shadow-sm inline-block" />
                  </div>
                </div>

                {/* Orbit 3: Outer Track (Clockwise) */}
                <div
                  className="absolute top-1/2 left-1/2 rounded-full border border-dashed border-[#0A1B37]/20 pointer-events-none will-change-transform w-[550px] h-[550px] sm:w-[570px] sm:h-[570px] lg:w-[590px] lg:h-[590px]"
                  style={{ animation: 'orbitClockwise 48s linear infinite' }}
                >
                  {/* Student Avatar: Meera (at ~6 o'clock - Enriched Large Avatar) */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <div className="w-18 h-18 sm:w-20 sm:h-20 lg:w-[5.25rem] lg:h-[5.25rem] rounded-full border-4 border-white shadow-2xl bg-white overflow-hidden flex items-center justify-center transition-transform hover:scale-110">
                      <img
                        src={meeraImg}
                        alt="Meera"
                        className="w-full h-full object-cover object-top scale-125 origin-top select-none pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Terracotta Circle (at ~2:30 o'clock) */}
                  <div
                    className="absolute top-[28%] right-[4%] translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <span className="w-4 h-4 rounded-full bg-terracotta inline-block shadow-sm" />
                  </div>

                  {/* Navy Circle (at ~4 o'clock) */}
                  <div
                    className="absolute top-[68%] right-[4%] translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#0A1B37] inline-block shadow-sm" />
                  </div>

                  {/* Gold Planet Orb (at ~9 o'clock) */}
                  <div
                    className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                    style={{ animation: 'counterRotateClockwise 48s linear infinite' }}
                  >
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#CDA96B] shadow-md inline-block border-2 border-[#F4EFE6]" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Contact Form & Information Split Section */}
        <section
          id="contact-form"
          className="w-full bg-[#F3EFE6] bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] py-12 sm:py-16 select-text"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
              {/* Left Card: We'd love to hear from you. */}
              <div className="lg:col-span-5 bg-[#0A1B37] border border-white/10 rounded-[28px] sm:rounded-[36px] p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[580px] sm:min-h-[640px]">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-[#CDA96B] font-manrope font-semibold text-xs tracking-wide mb-6 self-start bg-white/5">
                    Get in touch
                  </span>

                  <h2 className="font-makira font-medium text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-white leading-tight mb-8">
                    We’d love to <br />
                    hear from you.
                  </h2>

                  <div className="mb-6">
                    <span className="text-xs text-[#8B9BB4] font-medium block mb-1">Email</span>
                    <a
                      href="mailto:hello@hunhar.com"
                      className="text-base sm:text-lg font-bold text-white hover:text-terracotta transition-colors block"
                    >
                      hello@hunhar.com
                    </a>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs text-[#8B9BB4] font-medium block mb-1">Phone</span>
                    <a
                      href="tel:+919876543210"
                      className="text-base sm:text-lg font-bold text-white hover:text-terracotta transition-colors block"
                    >
                      +91 9876543210
                    </a>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs text-[#8B9BB4] font-medium block mb-1">Support hours</span>
                    <span className="text-sm sm:text-base font-semibold text-white block">
                      Monday to Saturday, 10 am to 6 pm
                    </span>
                  </div>

                  {/* Social Media Icons (Above Mascot, No Text) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 z-10 relative mt-4 flex-wrap">
                    <a
                      href="https://www.instagram.com/theunoia_?exln=MXJoeHU1aXMzMmZudw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-terracotta hover:bg-terracotta/20 flex items-center justify-center transition-all bg-white/5 cursor-pointer shadow-sm"
                    >
                      <FaInstagram className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.facebook.com/share/1DJMDqYiUN/?mibextid=wwXIfr"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-terracotta hover:bg-terracotta/20 flex items-center justify-center transition-all bg-white/5 cursor-pointer shadow-sm"
                    >
                      <FaFacebookF className="w-4 h-4" />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-terracotta hover:bg-terracotta/20 flex items-center justify-center transition-all bg-white/5 cursor-pointer shadow-sm"
                    >
                      <FaLinkedinIn className="w-4 h-4" />
                    </a>
                    <a
                      href="https://youtube.com/@theunoia?si=4_g5OfQuin4f1fI9"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-terracotta hover:bg-terracotta/20 flex items-center justify-center transition-all bg-white/5 cursor-pointer shadow-sm"
                    >
                      <FaYoutube className="w-4 h-4" />
                    </a>
                    <a
                      href="https://x.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="X (Twitter)"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/90 hover:text-white hover:border-terracotta hover:bg-terracotta/20 flex items-center justify-center transition-all bg-white/5 cursor-pointer shadow-sm"
                    >
                      <FaXTwitter className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Mascot sitting at bottom right with smooth transition */}
                <div className="absolute -bottom-1 right-0 sm:right-2 w-44 sm:w-52 lg:w-56 h-48 sm:h-56 lg:h-64 pointer-events-none select-none z-0 flex items-end justify-end">
                  <img
                    src={mascotLaptopImg}
                    alt="Hunhar student wolf mascot with laptop"
                    className={`absolute bottom-0 right-0 w-full h-auto max-h-full object-contain transition-all duration-500 ease-in-out ${activeRole === 'student'
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 translate-y-3 pointer-events-none'
                      }`}
                  />
                  <img
                    src={mascotBusinessImg}
                    alt="Hunhar business wolf mascot in suit"
                    className={`absolute bottom-0 right-0 w-full h-auto max-h-full object-contain transition-all duration-500 ease-in-out ${activeRole === 'business'
                      ? 'opacity-100 scale-100 translate-y-0'
                      : 'opacity-0 scale-95 translate-y-3 pointer-events-none'
                      }`}
                  />
                </div>
              </div>

              {/* Right Card: Tell us about you. (Form - Clean White Card with Warm Accents) */}
              <div className="lg:col-span-7 bg-white border border-[#E5DEC9] rounded-[28px] sm:rounded-[36px] p-8 sm:p-12 shadow-2xl shadow-black/5 relative flex flex-col justify-between">
                <div>
                  <span className="inline-block px-4 py-1.5 rounded-full border border-terracotta/40 text-terracotta font-manrope font-semibold text-xs tracking-wide mb-5 self-start bg-terracotta/10">
                    Start the conversation
                  </span>

                  <h2 className="font-makira font-medium text-2xl sm:text-3xl md:text-4xl uppercase tracking-wide text-[#0A1B37] leading-tight mb-2">
                    Tell us about you.
                  </h2>

                  <p className="font-manrope text-sm sm:text-base text-[#555E6D] mb-8 font-medium">
                    Choose your side and we’ll send your message to the right team.
                  </p>

                  {/* Role Switcher Pill - Full Rounded / Capsule Pill */}
                  <div className="w-full rounded-full bg-[#F3EFE6] p-1.5 border border-[#E5DEC9] flex items-center mb-8 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveRole('student')}
                      className={`flex-1 py-3 px-4 sm:px-6 rounded-full font-manrope font-bold text-xs sm:text-sm md:text-base transition-all duration-300 cursor-pointer text-center ${activeRole === 'student'
                        ? 'bg-terracotta text-white shadow-md'
                        : 'text-[#0A1B37] hover:text-[#0A1B37] hover:bg-black/5'
                        }`}
                    >
                      I’m a student or freelancer
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRole('business')}
                      className={`flex-1 py-3 px-4 sm:px-6 rounded-full font-manrope font-bold text-xs sm:text-sm md:text-base transition-all duration-300 cursor-pointer text-center ${activeRole === 'business'
                        ? 'bg-[#CDA96B] text-[#0A1B37] shadow-md'
                        : 'text-[#0A1B37] hover:text-[#0A1B37] hover:bg-black/5'
                        }`}
                    >
                      I’m a business
                    </button>
                  </div>

                  {submitted ? (
                    <div className="text-center py-12 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mb-5 shadow-lg">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-[#0A1B37] mb-2">Message Sent!</h3>
                      <p className="font-manrope text-sm text-[#555E6D] max-w-md mb-6 leading-relaxed">
                        Thank you, {formData.name}. We have received your inquiry and our support team will reach out via {formData.email} shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false)
                          setFormData({ name: '', email: '', skill: '', message: '' })
                        }}
                        className="font-manrope text-sm font-bold text-terracotta hover:underline cursor-pointer"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col">
                      {/* Full Name & Email Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                        <div>
                          <label className="block font-manrope text-xs sm:text-sm font-semibold text-[#0A1B37] mb-2">
                            Full name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your full name"
                            className="w-full px-4 py-3.5 rounded-xl border border-[#E2D8C7] bg-[#F3EFE6] font-manrope text-sm sm:text-base text-[#0A1B37] placeholder:text-[#8C827A] focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block font-manrope text-xs sm:text-sm font-semibold text-[#0A1B37] mb-2">
                            Email address
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3.5 rounded-xl border border-[#E2D8C7] bg-[#F3EFE6] font-manrope text-sm sm:text-base text-[#0A1B37] placeholder:text-[#8C827A] focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Main Skill / Company Name */}
                      <div className="mb-5">
                        <label className="block font-manrope text-xs sm:text-sm font-semibold text-[#0A1B37] mb-2">
                          {activeRole === 'student' ? 'Your main skill' : 'Company name'}
                        </label>
                        <input
                          type="text"
                          value={formData.skill}
                          onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                          placeholder={
                            activeRole === 'student'
                              ? 'Design, development, writing, video...'
                              : 'Your company or brand'
                          }
                          className="w-full px-4 py-3.5 rounded-xl border border-[#E2D8C7] bg-[#F3EFE6] font-manrope text-sm sm:text-base text-[#0A1B37] placeholder:text-[#8C827A] focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white outline-none transition-all"
                        />
                      </div>

                      {/* Message Textarea */}
                      <div className="mb-6">
                        <label className="block font-manrope text-xs sm:text-sm font-semibold text-[#0A1B37] mb-2">
                          Message
                        </label>
                        <textarea
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder={
                            activeRole === 'student'
                              ? 'Tell us about your skills and what you want to work on.'
                              : 'Tell us about your project and the skills you need.'
                          }
                          className="w-full px-4 py-3.5 rounded-xl border border-[#E2D8C7] bg-[#F3EFE6] font-manrope text-sm sm:text-base text-[#0A1B37] placeholder:text-[#8C827A] focus:border-terracotta focus:ring-1 focus:ring-terracotta focus:bg-white outline-none transition-all resize-y"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-terracotta hover:bg-[#AA572D] active:scale-[0.99] text-white font-manrope font-bold text-base shadow-lg shadow-terracotta/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Send Message</span>
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenSignup={() => setIsSignupModalOpen(true)} />
      <SignupModal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </div>
  )
}

