import React, { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/landing/Hero'
import SkillsMarquee from '../components/landing/SkillsMarquee'
import TwoSides from '../components/landing/TwoSides'
import HowItWorks from '../components/landing/HowItWorks'
import SkillsShowcase from '../components/landing/SkillsShowcase'
import StartSmarter from '../components/landing/StartSmarter'
import HunharBenefits from '../components/landing/HunharBenefits'
import FAQ from '../components/landing/FAQ'
import CTASection from '../components/landing/CTASection'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'

export default function LandingPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)

  const handleOpenSignup = () => setIsSignupModalOpen(true)
  const handleCloseSignup = () => setIsSignupModalOpen(false)

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] text-navy selection:bg-terracotta selection:text-white">
      {/* Header / Navbar */}
      <Navbar onOpenSignup={handleOpenSignup} />

      {/* Main Home Page Sections */}
      <main className="flex-1 w-full">
        <Hero onOpenSignup={handleOpenSignup} />
        <TwoSides onOpenSignup={handleOpenSignup} />
        <HowItWorks />
        <SkillsShowcase onOpenSignup={handleOpenSignup} />
        <StartSmarter />
        <HunharBenefits />
        <SkillsMarquee />
        <FAQ />
        <CTASection onOpenSignup={handleOpenSignup} />
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
