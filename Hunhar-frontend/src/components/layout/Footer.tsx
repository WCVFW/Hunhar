import React from 'react'
import { motion } from 'framer-motion'
import hunharLogo from '../../assets/hunhar-Black.svg'
import footerGiantWordmark from '../../assets/image copy 4.png'

interface FooterLink {
  label: string
  href: string
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

const columns: FooterColumn[] = [
  {
    title: 'For Businesses',
    links: [
      { label: 'How to hire', href: '/#how-it-works' },
      { label: 'Post a Task', href: '/signup?role=client' },
      // { label: 'Browse Categories', href: '#categories' },
      // { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'For Students',
    links: [
      { label: 'How to find work', href: '/#how-it-works' },
      { label: 'Create Profile', href: '/signup?role=freelancer' },
      // { label: 'How Payments Work', href: '#payments' },
      // { label: 'Student Resources', href: '#resources' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Features', href: '/features' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund-policy' },
    ],
  },
]

interface FooterProps {
  onOpenSignup?: () => void
}

export default function Footer({ onOpenSignup }: FooterProps): React.JSX.Element {
  return (
    <footer
      className="relative w-full bg-[#07152B] text-white overflow-hidden pt-20 pb-0 select-text"
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1.1px, transparent 1.1px)',
        backgroundSize: '28px 28px',
      }}
      aria-label="Site Footer"
    >
      <div className="relative z-[5] max-w-[1320px] mx-auto px-6 sm:px-10">
        {/* Top 5-Column Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1fr_1fr] gap-12 sm:gap-10 lg:gap-8 w-full">
          {/* Column 1: Brand Info */}
          <div className="flex flex-col items-start">
            <a
              href="/"
              className="inline-flex items-center no-underline mb-5 transition-opacity duration-200 hover:opacity-90"
              aria-label="Hunhar Home"
            >
              <img
                src={hunharLogo}
                alt="Hunhar Logo"
                className="h-9 sm:h-[2.65rem] w-auto max-w-[220px] sm:max-w-[240px] block object-contain [filter:invert(1)_hue-rotate(180deg)_brightness(1.15)_contrast(1.05)]"
              />
            </a>
            <p className="font-manrope text-[0.95rem] font-medium text-white/80 leading-[1.55] m-0">
              Built by students.
              <br />
              Powered by opportunity.
              <br />
              Made for everyone ready to grow.
            </p>
          </div>

          {/* Nav Link Columns */}
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col">
              <h4 className="font-makira text-base font-bold text-[#CBA96B] mb-5 tracking-[0.01em]">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-[0.85rem] list-none p-0 m-0">
                {col.links.map((link) => {
                  const isSignupAction = link.href.startsWith('/signup')
                  return (
                    <li key={link.label}>
                      {isSignupAction && onOpenSignup ? (
                        <button
                          type="button"
                          onClick={onOpenSignup}
                          className="inline-block font-manrope text-[0.9rem] font-medium text-white/70 hover:text-white transition-all duration-200 hover:translate-x-0.5 no-underline bg-transparent border-none p-0 cursor-pointer text-left"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          className="inline-block font-manrope text-[0.9rem] font-medium text-white/70 hover:text-white transition-all duration-200 hover:translate-x-0.5 no-underline"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Middle Divider */}
        <div className="w-full h-px bg-white/12 mt-18 mb-6" />

        {/* Copyright & Legal Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 font-manrope text-[0.85rem] text-white/55 mb-8">
          <p className="m-0">@2026 Hunhar. All rights Reserved</p>
          <div className="flex items-center gap-9">
            <a
              href="/terms"
              className="text-white/55 hover:text-white no-underline transition-colors duration-200"
            >
              Terms & conditions
            </a>
            <a
              href="/privacy"
              className="text-white/55 hover:text-white no-underline transition-colors duration-200"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================
          BOTTOM GIANT HUNHAR LOGO
          - Uses hunhar-Black.svg image from assets
          - Smooth entrance on scroll (whileInView)
          - Left & right soft vignette shadows only
         ========================================================= */}
      <div
        className="relative w-full overflow-hidden flex justify-center items-end pointer-events-none select-none mt-6 p-0"
        aria-hidden="true"
      >
        {/* Soft edge vignette shadows on far left and far right only */}
        <div className="absolute top-0 bottom-0 left-0 w-[12%] max-w-[160px] bg-gradient-to-r from-[#07152B]/85 to-transparent pointer-events-none z-[2]" />
        <div className="absolute top-0 bottom-0 right-0 w-[12%] max-w-[160px] bg-gradient-to-l from-[#07152B]/85 to-transparent pointer-events-none z-[2]" />

        <motion.div
          className="w-full max-w-[1440px] flex justify-center items-end px-2 sm:px-6"
          initial={{ y: 90, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={footerGiantWordmark}
            alt="Hunhar Giant Watermark"
            className="w-full h-auto block object-contain select-none pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          />
        </motion.div>
      </div>
    </footer>
  )
}
