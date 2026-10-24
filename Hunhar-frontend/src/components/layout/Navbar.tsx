import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import logo from '../../assets/hunhar-Black.svg'

interface NavLink {
  name: string
  href: string
}

interface NavbarProps {
  onOpenSignup?: () => void
}

const navLinks: NavLink[] = [
  { name: 'Home', href: '#' },
  { name: 'About', href: '#about' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Guides', href: '#start-smarter' },
  // { name: 'FAQ', href: '#faq' },
]

export default function Navbar({ onOpenSignup }: NavbarProps): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSignupClick = (e: React.MouseEvent) => {
    if (onOpenSignup) {
      e.preventDefault()
      onOpenSignup()
    }
  }

  return (
    <header
      className={`fixed z-50 transition-all duration-300 ease-in-out ${isScrolled
          ? 'top-0 left-0 right-0 rounded-none bg-white/90 backdrop-blur-md border-b border-black/5 shadow-sm'
          : 'top-3 sm:top-4 lg:top-5 left-3 sm:left-4 lg:left-5 right-3 sm:right-4 lg:right-5 bg-transparent border-b border-transparent shadow-none rounded-t-3xl sm:rounded-t-[2rem] lg:rounded-t-[2.5rem]'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center">
          <a href="/" className="flex items-center py-2 no-underline" aria-label="Hunhar Home">
            <img
              src={logo}
              alt="Hunhar Logo"
              className="h-8 md:h-9 w-auto object-contain block"
            />
          </a>
        </div>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="font-manrope text-[15px] font-semibold text-navy hover:text-terracotta transition-colors duration-150 no-underline"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Login link + Sign Up button */}
        <div className="hidden md:flex items-center gap-6">
          <a
            href="/login"
            className="font-manrope text-[15px] font-semibold text-navy hover:text-terracotta transition-colors duration-150 no-underline"
          >
            Login
          </a>
          {onOpenSignup ? (
            <button
              type="button"
              onClick={handleSignupClick}
              className="bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-manrope text-[15px] font-semibold px-6 py-2.5 rounded-full shadow-sm inline-flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:brightness-105 hover:shadow-md active:scale-98"
            >
              Sign Up
            </button>
          ) : (
            <a
              href="/signup"
              className="bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-manrope text-[15px] font-semibold px-6 py-2.5 rounded-full shadow-sm inline-flex items-center justify-center no-underline transition-all duration-200 hover:brightness-105 hover:shadow-md active:scale-98"
            >
              Sign Up
            </a>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-navy p-2 bg-transparent border-none cursor-pointer outline-none flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-ivory/95 backdrop-blur-md border-b border-beige/30 p-6 shadow-lg flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-manrope text-base font-semibold text-navy py-1.5 no-underline transition-colors duration-150 hover:text-terracotta"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-beige/30 flex flex-col gap-3">
            <a
              href="/login"
              className="font-manrope text-base font-semibold text-navy py-1.5 no-underline transition-colors duration-150 hover:text-terracotta"
            >
              Login
            </a>
            {onOpenSignup ? (
              <button
                type="button"
                onClick={(e) => {
                  setMobileMenuOpen(false)
                  handleSignupClick(e)
                }}
                className="bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-manrope text-[15px] font-semibold px-6 py-2.5 rounded-full shadow-sm block w-full text-center border-none cursor-pointer transition-all duration-200 hover:brightness-105 hover:shadow-md"
              >
                Sign Up
              </button>
            ) : (
              <a
                href="/signup"
                className="bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-manrope text-[15px] font-semibold px-6 py-2.5 rounded-full shadow-sm block w-full text-center no-underline transition-all duration-200 hover:brightness-105 hover:shadow-md"
              >
                Sign Up
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
