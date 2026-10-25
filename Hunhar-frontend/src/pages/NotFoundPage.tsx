import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react'
import hunharLogo from '../assets/hunhar-Black.svg'
import mascot from '../assets/mascot_laptop.png'
import { dashboardPathFor, getSessionRole } from '../services/api'

export default function NotFoundPage(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const role = getSessionRole()

  // Logged-in users get sent back to their own dashboard, guests to the landing page
  const primaryPath = role ? dashboardPathFor(role) : '/'
  const primaryLabel = role ? 'Go to my dashboard' : 'Back to home'

  const handleGoBack = () => {
    // history.state.idx is set by react-router; 0 means this page was opened directly
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate(primaryPath, { replace: true })
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#F4EFE6] font-manrope">
      {/* Navy curved top block */}
      <div className="pointer-events-none absolute left-0 top-0 h-[42vh] w-full rounded-b-[48px] bg-[#08182B]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <a href="/" aria-label="hunhar.in home" className="rounded-full bg-white px-4 py-2 shadow-sm">
          <img src={hunharLogo} alt="hunhar.in" className="block h-6 w-auto" />
        </a>
      </header>

      {/* Card */}
      <main className="relative z-10 flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-[560px] rounded-[28px] border border-[#EDE5D8] bg-white p-6 text-center shadow-[0_12px_40px_rgba(8,24,43,0.14)] sm:p-10">
          <img
            src={mascot}
            alt="Hunhar mascot looking for the page"
            className="mx-auto h-40 w-auto object-contain sm:h-48"
          />

          <p className="mt-4 font-makira text-[72px] font-bold leading-none text-[#C06B3E] sm:text-[96px]">
            404
          </p>
          <h1 className="m-0 mt-3 font-makira text-xl font-bold text-[#0F1B3D] sm:text-2xl">
            This page wandered off
          </h1>
          <p className="mx-auto mt-2 max-w-[400px] text-sm text-[#64748B]">
            We couldn't find the page you were looking for. It may have been moved, or the link might be wrong.
          </p>

          <code className="mx-auto mt-4 block max-w-full truncate rounded-lg border border-[#EDE5D8] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#8E8376]">
            {location.pathname}
          </code>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#D6DCE5] bg-white px-5 text-sm font-bold text-[#0F1B3D] transition-colors hover:border-[#C06B3E] hover:text-[#C06B3E]"
            >
              <ArrowLeft size={16} />
              Go back
            </button>
            <button
              type="button"
              onClick={() => navigate(primaryPath, { replace: true })}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#08182B] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#12294A]"
            >
              {role ? <LayoutDashboard size={16} /> : <Home size={16} />}
              {primaryLabel}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
