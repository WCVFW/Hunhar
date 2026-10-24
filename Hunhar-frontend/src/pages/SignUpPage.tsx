import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import hunharLogo from '../assets/hunhar-Black.svg'
import mascotBeanbag from '../assets/Signup_Mascot.png'

const labelClass =
  'mb-[clamp(2px,0.5vh,6px)] block text-[11px] font-semibold text-[#334155]'

// Height scales with screen height so the page never needs scrolling
const inputClass =
  'h-[clamp(32px,5vh,44px)] w-full rounded-lg border border-[#D6DCE5] bg-white px-3 text-xs text-[#0F1B3D] outline-none transition-colors placeholder:text-[#A0AEC0] focus:border-[#C06B3E] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0F1B3D]'

export default function SignUpPage(): React.JSX.Element {
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    rememberMe: false,
  })

  // Read URL search params (e.g. ?role=client&domain=it)
  const params = new URLSearchParams(window.location.search)
  const role = params.get('role') || 'freelancer'
  const domain = params.get('domain') || 'it'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Authentication flow: send role + domain along with the form data
    const payload = { ...formData, role, domain }
    void payload
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#F4EFE6] font-manrope lg:h-screen lg:overflow-hidden">
      {/* Mobile: navy top block */}
      <div className="pointer-events-none absolute left-0 top-0 h-[300px] w-full rounded-b-[40px] bg-[#08182B] lg:hidden" />

      {/* Desktop: curved navy shape (cream below it) */}
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* CURVE: change Q30,58 to tune the bend. End points: 53,0 (top) and 0,86 (left) */}
        <path d="M0,0 L53,0 Q30,58 0,86 Z" fill="#08182B" />
      </svg>

      {/* Back Arrow */}
      <a
        href="/"
        className="absolute left-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full text-white no-underline transition-colors hover:bg-white/10 lg:left-[2.5vw] lg:top-[4vh]"
        aria-label="Back to home"
      >
        <ArrowLeft size={22} strokeWidth={2.4} />
      </a>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center gap-6 px-4 pb-10 pt-16 lg:h-full lg:min-h-0 lg:flex-row lg:justify-between lg:gap-4 lg:px-[3vw] lg:py-0">

        {/* LEFT: Mascot */}
        <div className="flex min-w-0 items-end justify-center lg:h-full lg:flex-1 lg:pb-[3vh]">
          <img
            src={mascotBeanbag}
            alt="Wolf mascot sitting on beanbag"
            /* MASCOT SIZE: change lg:h-[82vh] (bigger = 90vh, smaller = 70vh) */
            className="h-auto w-[270px] max-w-full object-contain sm:w-[340px] lg:h-[82vh] lg:w-auto"
          />
        </div>

        {/* RIGHT: Form Card */}
        <div className="w-full max-w-[460px] lg:mr-[2vw] lg:w-[clamp(400px,34vw,520px)] lg:max-w-none lg:shrink-0">
          <div className="rounded-[28px] border border-[#EDE5D8] bg-white p-6 shadow-[0_12px_40px_rgba(8,24,43,0.14)] sm:p-8 lg:px-[clamp(20px,2.6vw,40px)] lg:py-[clamp(14px,5vh,32px)]">

            {/* Logo */}
            <div className="mb-[clamp(6px,1.4vh,16px)] flex justify-center">
              <img
                src={hunharLogo}
                alt="Hunhar Logo"
                className="block h-9 w-auto object-contain lg:h-[clamp(26px,4.6vh,42px)]"
              />
            </div>

            {/* Title */}
            <h1 className="m-0 mb-[clamp(8px,1.8vh,18px)] font-makira text-xl font-bold text-[#0F1B3D] lg:text-[clamp(17px,2.5vh,22px)]">
              Create an account
            </h1>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3.5 lg:gap-[clamp(7px,1.5vh,16px)]"
            >
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Phone Number + separate Send OTP box */}
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    placeholder="Enter Mobile Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    className="h-[clamp(32px,5vh,44px)] shrink-0 cursor-pointer rounded-lg border border-[#D6DCE5] bg-white px-3 text-[10px] font-semibold text-[#64748B] transition-colors hover:border-[#C06B3E] hover:text-[#C06B3E]"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  placeholder="user@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 cursor-pointer border-none bg-transparent p-0 text-[#94A3B8] transition-colors hover:text-[#475569]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot */}
              <div className="-mt-1 flex items-center justify-between text-[11px]">
                <label className="flex cursor-pointer items-center gap-1.5 text-[#64748B]">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-[#CBD5E1] accent-[#08182B]"
                  />
                  Remember Me
                </label>
                <a
                  href="#forgot"
                  className="font-medium text-[#2F6FED] no-underline hover:underline"
                >
                  Forgot ?
                </a>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="h-[clamp(34px,5.4vh,46px)] w-full cursor-pointer rounded-lg border-none bg-[#08182B] text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#12294A]"
              >
                Create account
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E2E8F0]" />
                <span className="text-[10px] text-[#64748B]">or</span>
                <div className="h-px flex-1 bg-[#E2E8F0]" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                className="flex h-[clamp(34px,5.4vh,46px)] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#CFE4FF] text-xs font-semibold text-[#1A56C4] transition-colors hover:bg-[#BFDAFB]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Login Link */}
              <p className="m-0 text-center text-[11px] text-[#94A3B8]">
                Already Have An Account ?{' '}
                <a href="/login" className="font-bold text-[#0F1B3D] no-underline hover:underline">
                  Log In
                </a>
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}