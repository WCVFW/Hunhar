import React, { useState, useEffect, useRef } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'

import meeraImg from '../assets/about/meera_arch.jpg'
import vikashImg from '../assets/about/vikash_arch.jpg'
import rihanaImg from '../assets/about/rihana_arch.jpg'
import wolfRoundImg from '../assets/about/wolf_round.webp'
import wolfJarImg from '../assets/about/wolf_jar.webp'
import wolfTalentImg from '../assets/about/wolf_talent.webp'
import wolfBusinessImg from '../assets/about/wolf_business.webp'
import visionStudioImg from '../assets/about/vision_studio.jpg'
import wolfClosingImg from '../assets/about/wolf_closing.webp'

interface SkillChip {
  name: string
  color: string
  left: string
  bottom: string
  rotate: number
  delay: number
}

const skillChips: SkillChip[] = [
  { name: 'Design', color: 'bg-navy text-[#F3EFE6]', left: '6%', bottom: '26px', rotate: -4, delay: 0 },
  { name: 'Writing', color: 'bg-gold text-navy', left: '10%', bottom: '100px', rotate: 4, delay: 150 },
  { name: 'Marketing', color: 'bg-navy text-[#F3EFE6]', left: '26%', bottom: '175px', rotate: -3, delay: 300 },
  { name: 'Code', color: 'bg-[#FFF8EF] text-terracotta', left: '38%', bottom: '26px', rotate: 3, delay: 450 },
  { name: 'Music', color: 'bg-navy text-[#F3EFE6]', left: '46%', bottom: '100px', rotate: -5, delay: 600 },
  { name: 'Photography', color: 'bg-[#FFF8EF] text-terracotta', left: '66%', bottom: '100px', rotate: 3, delay: 750 },
  { name: 'Video', color: 'bg-gold text-navy', left: '64%', bottom: '26px', rotate: -2, delay: 900 },
]

interface BeliefCard {
  id: string
  number: string
  title: string
  description: string
  iconBg: string
  backBg: string
}

const beliefs: BeliefCard[] = [
  {
    id: 'b1',
    number: '01',
    title: 'Skills Over Labels',
    description: 'Your abilities matter more than where you started.',
    iconBg: 'bg-terracotta',
    backBg: 'bg-terracotta text-[#FFF8EF]',
  },
  {
    id: 'b2',
    number: '02',
    title: 'Growth Through Opportunity',
    description: 'Every project is a chance to learn and improve.',
    iconBg: 'bg-[#0A1B37] border border-white/15',
    backBg: 'bg-[#0E1E38] border border-white/10 text-[#F3EFE6]',
  },
  {
    id: 'b3',
    number: '03',
    title: 'Better Together',
    description: 'Great things happen when the right people connect.',
    iconBg: 'bg-gold',
    backBg: 'bg-terracotta text-[#FFF8EF]',
  },
  {
    id: 'b4',
    number: '04',
    title: 'Everyone Deserves a Start',
    description: 'Every talent deserves a chance to shine.',
    iconBg: 'bg-terracotta',
    backBg: 'bg-[#0E1E38] border border-white/10 text-[#F3EFE6]',
  },
]

interface ConfettiParticle {
  x: string
  s: string
  c: string
  d: string
  type: 'triangle' | 'square' | 'circle'
}

const confettiParticles: ConfettiParticle[] = [
  { x: '8%', s: '22px', c: '#0A1B37', d: '0s', type: 'triangle' },
  { x: '22%', s: '30px', c: '#cda96b', d: '0.8s', type: 'square' },
  { x: '36%', s: '18px', c: '#fff8ef', d: '1.6s', type: 'circle' },
  { x: '52%', s: '26px', c: '#0A1B37', d: '0.4s', type: 'triangle' },
  { x: '64%', s: '20px', c: '#cda96b', d: '1.2s', type: 'square' },
  { x: '78%', s: '28px', c: '#fff8ef', d: '2s', type: 'circle' },
  { x: '90%', s: '22px', c: '#0A1B37', d: '0.6s', type: 'triangle' },
]

export default function AboutPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})

  // Animation values for scroll-driven story section
  const [sceneProgress, setSceneProgress] = useState<number>(0)
  const [textProgress, setTextProgress] = useState<number>(0)

  // Magnet duo scroll progress for "Two Sides. One Shared Goal."
  const [howProgress, setHowProgress] = useState<number>(0)

  // Purpose jar falling chips trigger
  const [isJarVisible, setIsJarVisible] = useState<boolean>(false)

  // Vision section scroll & reveal triggers
  const [visionProgress, setVisionProgress] = useState<number>(0)
  const [isVisionHeadingInView, setIsVisionHeadingInView] = useState<boolean>(false)
  const [isVisionCardInView, setIsVisionCardInView] = useState<boolean>(false)

  // Closing CTA section triggers
  const [isClosingInView, setIsClosingInView] = useState<boolean>(false)

  const storyRef = useRef<HTMLElement>(null)
  const jarRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLElement>(null)
  const visionRef = useRef<HTMLDivElement>(null)
  const visionHeadingRef = useRef<HTMLHeadingElement>(null)
  const visionCardRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef<HTMLElement>(null)

  const handleOpenSignup = () => setIsSignupModalOpen(true)
  const handleCloseSignup = () => setIsSignupModalOpen(false)

  const handleScrollToStory = () => {
    storyRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleCard = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Scroll observer for story section
  useEffect(() => {
    window.scrollTo(0, 0)

    const clamp = (v: number) => Math.min(1, Math.max(0, v))

    const handleScroll = () => {
      const vh = window.innerHeight

      if (storyRef.current) {
        const r = storyRef.current.getBoundingClientRect()
        const scrollRange = Math.max(1, r.height - vh)
        const p = clamp(-r.top / scrollRange)

        // Circles slide inward (0 to 0.70)
        const sp = clamp(p / 0.7)
        setSceneProgress(sp)

        // Text crossfade (0.20 to 0.65)
        const tp = clamp((p - 0.2) / 0.45)
        setTextProgress(tp)
      }

      if (howRef.current) {
        const d = howRef.current.getBoundingClientRect()
        const q = clamp((vh * 0.95 - d.top) / (vh * 0.75))
        setHowProgress(q)
      }

      if (visionRef.current) {
        const v = visionRef.current.getBoundingClientRect()
        const k = clamp((vh * 0.95 - v.top) / (vh * 0.8))
        setVisionProgress(k)
      }
    }

    let ticking = false
    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          handleScroll()
        })
      }
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [])

  // Intersection observer for Purpose jar falling chips & Vision reveal triggers
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === jarRef.current) {
              setIsJarVisible(true)
            }
            if (entry.target === visionHeadingRef.current) {
              setIsVisionHeadingInView(true)
            }
            if (entry.target === visionCardRef.current) {
              setIsVisionCardInView(true)
            }
            if (entry.target === closingRef.current) {
              setIsClosingInView(true)
            }
          }
        })
      },
      { threshold: 0.15 }
    )

    if (jarRef.current) {
      observer.observe(jarRef.current)
    }
    if (visionHeadingRef.current) {
      observer.observe(visionHeadingRef.current)
    }
    if (visionCardRef.current) {
      observer.observe(visionCardRef.current)
    }
    if (closingRef.current) {
      observer.observe(closingRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white overflow-x-clip select-text">
      {/* Sticky In-Card Adaptive Navbar */}
      <Navbar onOpenSignup={handleOpenSignup} />

      <main className="flex-1 w-full select-text">
        {/* HERO SECTION C */}
        <div className="p-3 sm:p-4 lg:p-5 bg-[#0A1B37]">
          <section className="relative rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-[#F3EFE6] text-navy overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20 px-6 sm:px-10 lg:px-14 bg-[radial-gradient(rgba(10,27,55,0.12)_1.1px,transparent_1.2px)] [background-size:40px_40px] select-text">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Heading, Subhead, CTA */}
              <div className="flex flex-col items-start lg:col-span-6 z-10 select-text">
                <span className="inline-block px-4 py-1.5 rounded-full bg-white text-terracotta border border-terracotta/40 font-bold text-xs sm:text-sm tracking-wide shadow-sm select-text">
                  Hunhar, a THE UNOiA brand
                </span>
                <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-7xl text-navy tracking-tight leading-[0.95] mt-5 mb-6 max-w-lg select-text">
                  Great Talent Deserves to Be <span className="text-terracotta select-text">Discovered.</span>
                </h1>
                <p className="font-manrope text-base sm:text-lg text-navy/80 max-w-lg mb-8 leading-relaxed font-medium select-text">
                  Hunhar connects talented individuals with real opportunities and businesses with the right skills to bring ideas to life.
                </p>
                <button
                  type="button"
                  onClick={handleScrollToStory}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-terracotta hover:bg-[#AA572D] text-[#FFF8EF] font-manrope font-bold text-base transition-transform duration-200 hover:-translate-y-0.5 shadow-lg shadow-terracotta/25 cursor-pointer"
                >
                  Discover Our Story <span aria-hidden="true">&darr;</span>
                </button>
              </div>

              {/* Right Column: Arches, Opportunity Badge, Mascot */}
              <div className="lg:col-span-6 relative max-w-lg mx-auto lg:max-w-none w-full select-text">
                {/* Floating Opportunity Pill Badge */}
                <div className="absolute -top-7 left-2 sm:left-6 z-20 flex items-center gap-3 bg-navy text-[#F3EFE6] px-4 py-2.5 rounded-2xl -rotate-6 shadow-2xl border border-white/10 select-text">
                  <span className="w-8 h-8 rounded-full bg-terracotta flex-shrink-0" />
                  <div className="flex flex-col leading-tight select-text">
                    <b className="text-xs sm:text-sm font-bold select-text">Packaging redesign</b>
                    <small className="text-[#CDA96B] font-bold text-[11px] select-text">Open for bids</small>
                  </div>
                </div>

                {/* 3 Student Arch Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-8 select-text">
                  {/* Meera */}
                  <figure className="relative rounded-t-[4rem] sm:rounded-t-[5rem] overflow-hidden bg-[#E2D6C5] shadow-md h-[240px] sm:h-[310px] flex flex-col justify-end group select-text">
                    <img
                      src={meeraImg}
                      alt="Meera S., Illustrator"
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                    />
                    <figcaption className="relative z-10 p-2 sm:p-2.5 m-2 bg-white/95 backdrop-blur-sm rounded-xl text-center shadow select-text">
                      <b className="block text-navy text-xs sm:text-sm font-bold truncate select-text">Meera S.</b>
                      <small className="block text-navy/70 text-[10px] sm:text-xs font-semibold select-text">Illustrator</small>
                    </figcaption>
                  </figure>

                  {/* Vikash Kumar (Center taller arch) */}
                  <figure className="relative rounded-t-[5rem] sm:rounded-t-[6rem] overflow-hidden bg-[#D8C7B0] shadow-lg h-[290px] sm:h-[370px] flex flex-col justify-end group select-text">
                    <img
                      src={vikashImg}
                      alt="Vikash Kumar, App developer"
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                    />
                    <figcaption className="relative z-10 p-2 sm:p-2.5 m-2 bg-white/95 backdrop-blur-sm rounded-xl text-center shadow select-text">
                      <b className="block text-navy text-xs sm:text-sm font-bold truncate select-text">Vikash Kumar</b>
                      <small className="block text-navy/70 text-[10px] sm:text-xs font-semibold select-text">App developer</small>
                    </figcaption>
                  </figure>

                  {/* Rihana */}
                  <figure className="relative rounded-t-[4rem] sm:rounded-t-[5rem] overflow-hidden bg-[#CFBBA1] shadow-md h-[260px] sm:h-[330px] flex flex-col justify-end group select-text">
                    <img
                      src={rihanaImg}
                      alt="Rihana, Copywriter"
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                    />
                    <figcaption className="relative z-10 p-2 sm:p-2.5 m-2 bg-white/95 backdrop-blur-sm rounded-xl text-center shadow select-text">
                      <b className="block text-navy text-xs sm:text-sm font-bold truncate select-text">Rihana</b>
                      <small className="block text-navy/70 text-[10px] sm:text-xs font-semibold select-text">Copywriter</small>
                    </figcaption>
                  </figure>
                </div>

                {/* Circular Mascot Pinned Badge */}
                <img
                  src={wolfRoundImg}
                  alt="Hunhar wolf mascot"
                  className="absolute -bottom-4 -right-2 sm:-right-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover object-top bg-navy border-4 border-[#F3EFE6] shadow-2xl z-30 pointer-events-none"
                />
              </div>
            </div>

            {/* Marquee Ticker */}
            <div className="overflow-hidden bg-navy text-[#F3EFE6] py-3.5 -mx-6 sm:-mx-10 lg:-mx-14 -mb-12 sm:-mb-16 lg:-mb-20 mt-12 flex items-center border-t border-navy/20 select-text" aria-hidden="true">
              <div className="flex shrink-0 gap-8 animate-marquee whitespace-nowrap text-sm sm:text-base font-bold font-display tracking-wide uppercase select-text">
                <span>Design</span>
                <span className="text-terracotta">●</span>
                <span>Development</span>
                <span className="text-gold">■</span>
                <span>Video</span>
                <span className="text-terracotta">▲</span>
                <span>Writing</span>
                <span className="text-gold">●</span>
                <span>Marketing</span>
                <span className="text-terracotta">■</span>
                <span>Photography</span>
                <span className="text-gold">▲</span>
                <span>Music</span>
                <span className="text-terracotta">●</span>
                <span>Translation</span>
                <span className="text-gold">■</span>
                <span>Design</span>
                <span className="text-terracotta">●</span>
                <span>Development</span>
                <span className="text-gold">■</span>
                <span>Video</span>
                <span className="text-terracotta">▲</span>
                <span>Writing</span>
                <span className="text-gold">●</span>
                <span>Marketing</span>
                <span className="text-terracotta">■</span>
                <span>Photography</span>
                <span className="text-gold">▲</span>
                <span>Music</span>
                <span className="text-terracotta">●</span>
                <span>Translation</span>
                <span className="text-gold">■</span>
              </div>
            </div>
          </section>
        </div>

        {/* PINNED STORY SECTION (OUR STORY) */}
        <section id="story" ref={storyRef} className="relative bg-[#0A1B37] text-[#F3EFE6] h-[170vh] select-text" aria-label="Our story">
          <div className="sticky top-0 h-screen flex flex-col justify-center items-center text-center px-6 pt-20 pb-8 overflow-hidden max-w-5xl mx-auto select-text">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-gold border border-gold/40 font-bold text-xs sm:text-sm tracking-wide mb-4 select-text">
              Our Story
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#F3EFE6] tracking-tight leading-[1.05] max-w-3xl mb-8 select-text">
              Talent Is Everywhere. Opportunity Should Be Too.
            </h2>

            {/* Connecting Talent & Opportunity Scene */}
            <div className="relative w-full max-w-[720px] h-[110px] mb-8 select-text" aria-hidden="true">
              {/* Connecting Line */}
              <div
                className="absolute top-1/2 left-1/2 h-[3px] -translate-x-1/2 -translate-y-1/2 bg-[#F3EFE6] opacity-80"
                style={{ width: `${sceneProgress * 70}%` }}
              />

              {/* Talent (Circle) */}
              <div
                className="absolute top-2 flex flex-col items-center"
                style={{ left: `${sceneProgress * 38}%` }}
              >
                <div className="w-16 h-16 rounded-full bg-terracotta shadow-xl" />
                <span className="mt-2 text-xs font-bold text-[#9FB0D6] tracking-wide select-text">Talent</span>
              </div>

              {/* Opportunity (Square) */}
              <div
                className="absolute top-2 flex flex-col items-center"
                style={{ right: `${sceneProgress * 38}%` }}
              >
                <div className="w-16 h-16 rounded-xl bg-gold shadow-xl" />
                <span className="mt-2 text-xs font-bold text-[#9FB0D6] tracking-wide select-text">Opportunity</span>
              </div>
            </div>

            {/* Crossfading Story Text */}
            <div className="relative w-full max-w-xl h-24 flex items-center justify-center font-manrope font-bold text-lg sm:text-2xl text-center leading-snug px-4 select-text">
              <p
                className="absolute inset-x-0 transition-opacity duration-100 text-[#F3EFE6]/90 select-text"
                style={{
                  opacity: 1 - textProgress,
                  transform: `translateY(${-20 * textProgress}px)`,
                }}
              >
                Getting the first opportunity can be difficult, even when you have the skills.
              </p>
              <p
                className="absolute inset-x-0 transition-opacity duration-100 text-white font-extrabold select-text"
                style={{
                  opacity: textProgress,
                  transform: `translateY(${20 * (1 - textProgress)}px)`,
                }}
              >
                Hunhar bridges that gap by connecting emerging talent with businesses that value fresh ideas and real skills.
              </p>
            </div>
          </div>
        </section>

        {/* OUR PURPOSE (EXACT MATCH TO DESIGN WITH FALLING CHIPS & TOP-RIGHT WOLF) */}
        <section className="bg-terracotta text-[#FFF8EF] py-20 sm:py-28 px-6 sm:px-12 lg:px-20 select-text">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center select-text">
            {/* Left Column: Heading and description */}
            <div className="lg:col-span-5 select-text">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-[#FFF8EF] font-bold text-xs sm:text-sm tracking-wide mb-4 select-text">
                Our Purpose
              </span>
              <h2 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#FFF8EF] tracking-tight leading-[1.05] mb-6 select-text">
                We’re Here to Make <br />
                Talent Count.
              </h2>
              <p className="font-manrope text-base sm:text-lg text-[#FFF8EF]/90 leading-relaxed max-w-md font-medium select-text">
                We help people turn their skills into real experience while helping businesses find the talent they need to grow.
              </p>
            </div>

            {/* Right Column: Dashed Jar Box with Falling Chips and Top-Right Wolf Mascot */}
            <div
              ref={jarRef}
              className="lg:col-span-7 relative h-[380px] sm:h-[400px] rounded-[2.5rem] border-2 border-dashed border-[#FFF8EF]/50 bg-black/5 overflow-hidden p-6 select-text"
            >
              {/* Top-Right Wolf Mascot (Exact location from user design) */}
              <img
                src={wolfJarImg}
                alt="Hunhar wolf mascot winking and giving thumbs up"
                className={`absolute top-2 right-4 sm:right-6 w-36 sm:w-44 h-auto object-contain z-20 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isJarVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                style={{
                  transformOrigin: 'top right',
                  transitionDelay: '1100ms',
                }}
              />

              {/* Falling Skill Chips inside the box */}
              {skillChips.map((chip) => {
                return (
                  <span
                    key={chip.name}
                    className={`absolute px-5 py-2.5 rounded-full font-display font-bold text-sm sm:text-base shadow-xl whitespace-nowrap cursor-default select-text ${chip.color}`}
                    style={{
                      left: chip.left,
                      bottom: chip.bottom,
                      transition:
                        'transform 0.85s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease',
                      transitionDelay: `${chip.delay}ms`,
                      transform: isJarVisible
                        ? `translateY(0px) rotate(${chip.rotate}deg)`
                        : `translateY(-420px) rotate(${chip.rotate * 4}deg)`,
                      opacity: isJarVisible ? 1 : 0,
                    }}
                  >
                    {chip.name}
                  </span>
                )
              })}
            </div>
          </div>
        </section>

        {/* WHAT WE BELIEVE (INTERACTIVE 3D FLIP CARDS) */}
        <section className="bg-[#0A1B37] text-[#F3EFE6] py-20 sm:py-28 px-6 sm:px-12 lg:px-20 select-text">
          <div className="max-w-6xl mx-auto select-text">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-gold border border-gold/40 font-bold text-xs sm:text-sm tracking-wide mb-10 select-text">
              What We Believe
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-text">
              {beliefs.map((b) => {
                const isFlipped = !!flippedCards[b.id]
                return (
                  <div
                    key={b.id}
                    onClick={() => toggleCard(b.id)}
                    className="relative h-80 sm:h-[320px] rounded-3xl cursor-pointer [perspective:1000px] select-text group"
                  >
                    <div
                      className={`relative w-full h-full rounded-3xl transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] ${
                        isFlipped ? '[transform:rotateY(180deg)]' : ''
                      }`}
                    >
                      {/* Front Face */}
                      <div className="absolute inset-0 w-full h-full rounded-3xl bg-[#0E1E38] border border-white/10 p-7 flex flex-col justify-between [backface-visibility:hidden] shadow-2xl transition-colors select-text">
                        <small className="text-gold font-bold text-sm tracking-wider select-text">{b.number}</small>
                        <div className="select-text">
                          <div className={`w-16 h-16 rounded-2xl ${b.iconBg} mb-5 shadow-md`} />
                          <h3 className="font-display font-extrabold text-2xl text-[#F3EFE6] leading-tight select-text">
                            {b.title}
                          </h3>
                        </div>
                        <span className="text-xs text-[#8B9BB4] uppercase tracking-wider font-bold select-text">
                          TAP TO FLIP
                        </span>
                      </div>

                      {/* Back Face */}
                      <div className={`absolute inset-0 w-full h-full rounded-3xl p-7 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] shadow-2xl select-text ${b.backBg}`}>
                        <small className="font-bold text-sm tracking-wider opacity-75 select-text">{b.number}</small>
                        <p className="font-display font-extrabold text-2xl leading-snug select-text">
                          {b.description}
                        </p>
                        <span className="text-xs uppercase tracking-wider font-bold opacity-75 select-text">
                          TAP TO FLIP BACK
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW HUNHAR WORKS (MAGNET DUO) */}
        <section ref={howRef} className="bg-[#0A1B37] text-white overflow-hidden py-16 sm:py-24 lg:py-28 px-6 sm:px-12 lg:px-20 text-center select-text">
          <div className="max-w-6xl mx-auto select-text">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-gold border border-gold/40 font-bold text-xs sm:text-sm tracking-wide mb-4 shadow-sm select-text">
              How Hunhar Works
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight mt-3 mb-10 sm:mb-14 max-w-xl mx-auto select-text">
              Two Sides. One Shared Goal.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_1fr] gap-6 max-w-5xl mx-auto text-left items-stretch select-text">
              {/* Card A: For Talent */}
              <article
                className="relative overflow-hidden bg-white text-navy rounded-[32px] p-8 sm:p-10 min-h-[340px] shadow-2xl flex flex-col justify-start select-text"
                style={{
                  transform: `translateX(calc((1 - ${howProgress}) * -45vw))`,
                  opacity: 0.2 + howProgress * 0.8,
                }}
              >
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-navy tracking-tight mb-3 select-text">
                  For Talent
                </h3>
                <p className="font-manrope text-navy/80 text-base sm:text-lg max-w-[20ch] leading-relaxed mb-6 select-text">
                  Discover projects, showcase your skills, and build real-world experience.
                </p>
                <img
                  src={wolfTalentImg}
                  alt="Hunhar wolf mascot in a hoodie"
                  className="absolute -right-2 bottom-0 w-[46%] max-w-[230px] pointer-events-none select-none object-contain"
                />
              </article>

              {/* Mid connecting dashed line and terracotta node */}
              <div className="hidden md:flex items-center justify-center relative select-none pointer-events-none" aria-hidden="true">
                <div
                  className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/70 origin-center"
                  style={{ transform: `scaleX(${howProgress})` }}
                />
                <div className="relative z-10 w-[26px] h-[26px] rounded-full bg-terracotta flex items-center justify-center shadow-md">
                  {howProgress > 0.98 && (
                    <span className="absolute w-[26px] h-[26px] rounded-full border-2 border-terracotta animate-ping" />
                  )}
                </div>
              </div>

              {/* Card B: For Businesses */}
              <article
                className="relative overflow-hidden bg-white text-navy rounded-[32px] p-8 sm:p-10 min-h-[340px] shadow-2xl flex flex-col justify-start select-text"
                style={{
                  transform: `translateX(calc((1 - ${howProgress}) * 45vw))`,
                  opacity: 0.2 + howProgress * 0.8,
                }}
              >
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-navy tracking-tight mb-3 select-text">
                  For Businesses
                </h3>
                <p className="font-manrope text-navy/80 text-base sm:text-lg max-w-[20ch] leading-relaxed mb-6 select-text">
                  Find skilled individuals, explore fresh ideas, and bring your projects to life.
                </p>
                <img
                  src={wolfBusinessImg}
                  alt="Hunhar wolf mascot in a suit"
                  className="absolute -right-2 bottom-0 w-[46%] max-w-[230px] pointer-events-none select-none object-contain"
                />
              </article>
            </div>
          </div>
        </section>

        {/* OUR VISION */}
        <section className="bg-[#F3EFE6] text-navy py-16 sm:py-24 lg:py-28 px-6 sm:px-12 lg:px-20 text-center select-text overflow-hidden">
          <div className="max-w-6xl mx-auto select-text">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white text-terracotta border border-terracotta/40 font-bold text-xs sm:text-sm tracking-wide mb-4 shadow-sm select-text">
              Our Vision
            </span>
            <h2
              ref={visionHeadingRef}
              className="font-display font-black text-3xl sm:text-5xl lg:text-7xl text-navy tracking-tight max-w-4xl mx-auto mb-12 sm:mb-16 select-text leading-[0.98]"
            >
              {['A', 'Future', 'Where', 'Talent', 'Has', 'No', 'Limits.'].map((word, i) => (
                <span
                  key={i}
                  className="inline-block overflow-hidden align-top pb-[0.12em] mr-[0.25em] last:mr-0 select-text"
                >
                  <i
                    className="inline-block not-italic transition-transform duration-900 ease-[cubic-bezier(0.2,0.8,0.2,1)] select-text"
                    style={{
                      transform: isVisionHeadingInView ? 'none' : 'translateY(112%)',
                      transitionDelay: `${i * 0.09}s`,
                    }}
                  >
                    {word}
                  </i>
                </span>
              ))}
            </h2>

            {/* Studio Window Card with Scroll-driven Arch Morph & Zoom */}
            <div ref={visionRef} className="relative max-w-6xl mx-auto select-text">
              <div
                className="overflow-hidden shadow-2xl transition-[clip-path] duration-75 ease-out"
                style={{
                  clipPath: `inset(${(14 * (1 - visionProgress)).toFixed(1)}% ${(32 * (1 - visionProgress)).toFixed(1)}% round ${(40 + 140 * (1 - visionProgress)).toFixed(0)}px)`,
                }}
              >
                <img
                  src={visionStudioImg}
                  alt="A creative professional walking through a busy studio"
                  className="w-full aspect-[16/8] min-h-[260px] sm:min-h-[380px] lg:min-h-[460px] object-cover pointer-events-none transition-transform duration-75 ease-out"
                  style={{
                    transform: `scale(${(1.2 - 0.2 * visionProgress).toFixed(3)})`,
                  }}
                />
              </div>

              {/* Floating Navy Card with Reveal Animation */}
              <div
                ref={visionCardRef}
                className="bg-navy text-[#F3EFE6] rounded-[28px] p-6 sm:p-7 max-w-[520px] text-left shadow-[0_20px_40px_rgba(10,27,55,0.3)] mt-6 sm:-mt-16 mx-4 relative min-[900px]:absolute min-[900px]:-left-6 min-[900px]:-bottom-8 min-[900px]:m-0 transition-all duration-800 ease-[cubic-bezier(0.2,0.8,0.2,1)] select-text"
                style={{
                  opacity: isVisionCardInView ? 1 : 0,
                  transform: isVisionCardInView ? 'none' : 'translateY(34px)',
                }}
              >
                <p className="font-manrope text-base sm:text-lg lg:text-xl font-normal leading-relaxed text-[#F3EFE6] m-0 select-text">
                  We envision a world where skills open doors, opportunities reach more people, and talent can thrive regardless of where it begins.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSING CALL TO ACTION */}
        <section
          ref={closingRef}
          className="relative overflow-hidden select-text w-full py-16 sm:py-20 lg:py-24 px-6 sm:px-12 lg:px-20 text-[#FFF8EF]"
          style={{ background: 'linear-gradient(90deg, #d6996d, #c06b3e 35%)' }}
        >
          <style>{`
            @keyframes cfUp {
              0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0;
              }
              15% {
                opacity: 0.85;
              }
              100% {
                transform: translateY(-460px) rotate(260deg);
                opacity: 0;
              }
            }
          `}</style>

          {/* Floating Confetti Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {confettiParticles.map((p, idx) => (
              <i
                key={idx}
                style={{
                  position: 'absolute',
                  bottom: '-50px',
                  left: p.x,
                  width: p.s,
                  height: p.s,
                  backgroundColor: p.c,
                  borderRadius: p.type === 'circle' ? '50%' : '0',
                  clipPath: p.type === 'triangle' ? 'polygon(50% 0, 100% 100%, 0 100%)' : undefined,
                  opacity: 0,
                  animation: isClosingInView ? `cfUp 3.4s ${p.d} ease-out infinite` : 'none',
                }}
              />
            ))}
          </div>

          <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-start justify-center">
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight max-w-[16ch] mb-3 leading-[1.08] select-text">
              Your Potential Deserves a Place to Grow.
            </h2>
            <p className="font-manrope text-base sm:text-lg lg:text-xl text-[#FFF8EF]/95 max-w-[34ch] mb-6 font-medium select-text">
              Ready to take the next step? Your journey starts with Hunhar.
            </p>
            <button
              type="button"
              onClick={handleOpenSignup}
              className="relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0A1B37] hover:bg-[#071326] text-white font-manrope font-bold text-base transition-transform duration-200 hover:-translate-y-0.5 shadow-xl shadow-[#0A1B37]/25 cursor-pointer"
            >
              Be Part of Hunhar <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          {/* Mascot Wolf at Bottom Right */}
          <img
            src={wolfClosingImg}
            alt="Hunhar wolf mascot"
            className="absolute right-[3%] sm:right-[6%] bottom-0 w-[28vw] max-w-[270px] min-w-[140px] h-auto object-contain pointer-events-none select-none z-10"
          />
        </section>
      </main>

      {/* Footer */}
      <Footer onOpenSignup={handleOpenSignup} />

      {/* Domain Selection Signup Modal */}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={handleCloseSignup}
      />
    </div>
  )
}
