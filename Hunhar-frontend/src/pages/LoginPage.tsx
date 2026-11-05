import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import hunharLogo from '../assets/hunhar-Black.svg'
import mascotBeanbag from '../assets/Signup_Mascot.png'

import { useNavigate } from 'react-router-dom'
import { authApi, startSession } from '../services/api'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'

type Mode = 'login' | 'forgot' | 'reset'

const labelClass =
  'mb-[clamp(2px,0.5vh,6px)] block text-[11px] font-semibold text-[#334155]'

// Height scales with screen height so the page never needs scrolling
const inputClass =
  'h-[clamp(34px,5.4vh,46px)] w-full rounded-lg border border-[#D6DCE5] bg-white px-3 text-xs text-[#0F1B3D] outline-none transition-colors placeholder:text-[#A0AEC0] focus:border-[#C06B3E] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0F1B3D]'

export default function LoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [notice, setNotice] = useState<string>('')
  const [mode, setMode] = useState<Mode>('login')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  })

  const switchMode = (m: Mode) => {
    setMode(m)
    setErrorMsg('')
    setNotice('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await authApi.login({ email: formData.email.trim(), password: formData.password })
        navigate(startSession(res, formData.rememberMe), { replace: true })
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(formData.email.trim())
        setMode('reset')
        setNotice(`If ${formData.email.trim()} has an account, we sent a 6-digit code to it. Check your inbox and spam folder.`)
      } else {
        if (!/^\d{6}$/.test(resetOtp)) throw new Error('Enter the 6-digit code from your email.')
        if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
          throw new Error('New password must be at least 8 characters and include a letter and a number.')
        }
        await authApi.resetPassword(formData.email.trim(), resetOtp, newPassword)
        setFormData({ ...formData, password: '' })
        setResetOtp('')
        setNewPassword('')
        setMode('login')
        setNotice('Password updated. Log in with your new password.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'login' ? 'Login to your account' : mode === 'forgot' ? 'Reset your password' : 'Enter code and new password'
  const submitLabel =
    mode === 'login' ? (loading ? 'Logging in...' : 'Login') : mode === 'forgot' ? (loading ? 'Sending code...' : 'Send reset code') : loading ? 'Saving...' : 'Set new password'

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

        {/* RIGHT: Form Card (vertically centered) */}
        <div className="w-full max-w-[460px] lg:mr-[2vw] lg:w-[clamp(400px,34vw,520px)] lg:max-w-none lg:shrink-0">
          <div className="rounded-[28px] border border-[#EDE5D8] bg-white p-6 shadow-[0_12px_40px_rgba(8,24,43,0.14)] sm:p-8 lg:px-[clamp(20px,2.6vw,40px)] lg:py-[clamp(24px,6vh,64px)]">

            {/* Logo */}
            <div className="mb-[clamp(14px,3.5vh,36px)] flex justify-center">
              <img
                src={hunharLogo}
                alt="Hunhar Logo"
                className="block h-9 w-auto object-contain lg:h-[clamp(30px,5.6vh,52px)]"
              />
            </div>

            {/* Title */}
            <h1 className="m-0 mb-[clamp(10px,2.2vh,22px)] font-makira text-xl font-bold text-[#0F1B3D] lg:text-[clamp(17px,2.5vh,22px)]">
              {title}
            </h1>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3.5 lg:gap-[clamp(8px,1.8vh,18px)]"
            >
              {/* Email */}
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  placeholder="user@gmail.com"
                  autoComplete="email"
                  disabled={mode === 'reset'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>

              {mode === 'login' && (
                <>
              {/* Password */}
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="cursor-pointer border-none bg-transparent p-0 text-[11px] font-medium text-[#2F6FED] hover:underline"
                >
                  Forgot ?
                </button>
              </div>

                </>
              )}

              {mode === 'reset' && (
                <>
                  <div>
                    <label className={labelClass}>Reset Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="6-digit code from your email"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      className={`${inputClass} font-mono tracking-widest`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters, letters and numbers"
                        autoComplete="new-password"
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                </>
              )}

              {notice && (
                <div role="status" className="flex items-start gap-1.5 rounded-lg border border-green-200 bg-green-50 p-2 text-left text-xs font-semibold text-green-700">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>{notice}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div role="alert" className="rounded-lg bg-red-50 p-2 text-center text-xs font-semibold text-red-600 border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-[clamp(34px,5.4vh,46px)] w-full cursor-pointer rounded-lg border-none bg-[#08182B] text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#12294A] disabled:opacity-60"
              >
                {submitLabel}
              </button>

              {mode === 'login' ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#E2E8F0]" />
                    <span className="text-[10px] text-[#64748B]">or</span>
                    <div className="h-px flex-1 bg-[#E2E8F0]" />
                  </div>
                  <GoogleAuthButton onError={setErrorMsg} />
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="cursor-pointer border-none bg-transparent p-0 text-center text-[11px] font-bold text-[#0F1B3D] hover:underline"
                >
                  Back to login
                </button>
              )}

              {/* Sign Up Link */}
              <p className="m-0 mt-1 text-center text-[11px] text-[#94A3B8]">
                Don't Have An Account?{' '}
                <a href="/signup" className="font-bold text-[#0F1B3D] no-underline hover:underline">
                  Sign Up
                </a>
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  )
}