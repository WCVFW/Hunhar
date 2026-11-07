import React, { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import FeaturesHero from '../components/landing/FeaturesHero'
import PlatformCapabilities from '../components/landing/PlatformCapabilities'
import AIEngineSection from '../components/landing/AIEngineSection'
import AIGrowthToolsSection from '../components/landing/AIGrowthToolsSection'
import FeaturesCTASection from '../components/landing/FeaturesCTASection'
import Footer from '../components/layout/Footer'
import SignupModal from '../components/landing/SignupModal'

export default function FeaturesPage(): React.JSX.Element {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState<boolean>(false)

  // Scroll to top when opening the page
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleOpenSignup = () => setIsSignupModalOpen(true)
  const handleCloseSignup = () => setIsSignupModalOpen(false)

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden bg-white bg-[image:radial-gradient(#E8DFC9_1.1px,transparent_1.1px)] bg-[length:32px_32px] text-navy selection:bg-terracotta selection:text-white">
      {/* Header / Navbar */}
      <Navbar onOpenSignup={handleOpenSignup} />

      {/* Main Subpage Content */}
      <main className="flex-1 w-full">
        {/* 1st Section: Features Hero Section */}
        <FeaturesHero onOpenSignup={handleOpenSignup} />

        {/* 2nd Section: Platform Capabilities (3 Interactive Tabs) */}
        <PlatformCapabilities />

        {/* 3rd Section: AI Engine (3-Way Animated Flow) */}
        <AIEngineSection />

        {/* 4th Section: AI Growth Tools (Luna Mascot & 3 Cards) */}
        <AIGrowthToolsSection />

        {/* 5th Section: Final Features CTA Section */}
        <FeaturesCTASection onOpenSignup={handleOpenSignup} />
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
