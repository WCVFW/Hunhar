import React, { useState, useEffect } from 'react'
import { ArrowLeft, Eye, EyeOff, CheckCircle2, ShieldCheck, RefreshCw, UserRound, Briefcase } from 'lucide-react'
import hunharLogo from '../assets/hunhar-Black.svg'
import mascotBeanbag from '../assets/Signup_Mascot.png'

import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, startSession } from '../services/api'
import GoogleAuthButton from '../components/auth/GoogleAuthButton'

const labelClass =
  'mb-[clamp(2px,0.5vh,6px)] block text-[11px] font-semibold text-[#334155]'

const inputClass =
  'h-[clamp(32px,5vh,44px)] w-full rounded-lg border border-[#D6DCE5] bg-white px-3 text-xs text-[#0F1B3D] outline-none transition-colors placeholder:text-[#A0AEC0] focus:border-[#C06B3E] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#0F1B3D]'

export default function SignUpPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  
  // Email OTP Verification States
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [sendingOtp, setSendingOtp] = useState<boolean>(false)
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false)
  const [enteredOtp, setEnteredOtp] = useState<string>('')
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(0)
  const [otpNotice, setOtpNotice] = useState<string>('')
  const [otpError, setOtpError] = useState<string>('')

  // Mobile (SMS) OTP Verification States
  const [mOtpSent, setMOtpSent] = useState<boolean>(false)
  const [mSending, setMSending] = useState<boolean>(false)
  const [mVerifying, setMVerifying] = useState<boolean>(false)
  const [mOtp, setMOtp] = useState<string>('')
  const [mVerified, setMVerified] = useState<boolean>(false)
  const [mCountdown, setMCountdown] = useState<number>(0)
  const [mNotice, setMNotice] = useState<string>('')
  const [mError, setMError] = useState<string>('')

  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    rememberMe: false,
  })

  // Role comes from the URL (?role=client) so landing-page links preselect it; the switch below updates it
  const [params, setParams] = useSearchParams()
  const role: 'freelancer' | 'client' = params.get('role') === 'client' ? 'client' : 'freelancer'
  const domain = params.get('domain') || ''
  const setRole = (r: 'freelancer' | 'client') => {
    const next = new URLSearchParams(params)
    next.set('role', r)
    setParams(next, { replace: true })
    setErrorMsg('')
  }

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: any
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    if (mCountdown <= 0) return
    const t = setInterval(() => setMCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(t)
  }, [mCountdown])

  const isValidMobile = (m: string) => /^[6-9][0-9]{9}$/.test(m)

  const handleSendMobileOtp = async () => {
    setMError('')
    setErrorMsg('')
    setMNotice('')
    if (!isValidMobile(formData.phone)) {
      setMError('Enter a valid 10-digit Indian mobile number first.')
      return
    }
    setMSending(true)
    try {
      await authApi.sendMobileOtp(formData.phone)
      setMOtpSent(true)
      setMOtp('')
      setMCountdown(30)
      setMNotice(`We sent a 6-digit code by SMS to +91 ${formData.phone}.`)
    } catch (err: any) {
      setMError(err.message || 'Could not send the SMS. Please try again.')
    } finally {
      setMSending(false)
    }
  }

  const handleVerifyMobileOtp = async () => {
    setMError('')
    if (!/^\d{6}$/.test(mOtp)) {
      setMError('Enter the 6-digit code from the SMS.')
      return
    }
    setMVerifying(true)
    try {
      await authApi.verifyMobileOtp(formData.phone, mOtp)
      setMVerified(true)
      setMNotice('')
    } catch (err: any) {
      setMError(err.message || 'Incorrect code. Please try again.')
    } finally {
      setMVerifying(false)
    }
  }

  // Changing the number after sending a code restarts the SMS flow
  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value.replace(/[^0-9]/g, '').slice(0, 10) })
    if (mOtpSent || mVerified) {
      setMOtpSent(false)
      setMVerified(false)
      setMOtp('')
      setMNotice('')
      setMError('')
      setMCountdown(0)
    }
  }

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSendOtp = async () => {
    setOtpError('')
    setErrorMsg('')
    setOtpNotice('')
    const email = formData.email.trim()
    if (!isValidEmail(email)) {
      setOtpError('Please enter a valid email address first.')
      return
    }

    setSendingOtp(true)
    try {
      await authApi.sendSignupOtp(email)
      setOtpSent(true)
      setEnteredOtp('')
      setCountdown(30)
      setOtpNotice(`We sent a 6-digit code to ${email}. Check your inbox (and spam folder).`)
    } catch (err: any) {
      setOtpError(err.message || 'Could not send verification code. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    const code = enteredOtp.trim()
    if (!/^\d{6}$/.test(code)) {
      setOtpError('Please enter the 6-digit code from your email.')
      return
    }

    setVerifyingOtp(true)
    try {
      await authApi.verifySignupOtp(formData.email.trim(), code)
      setIsVerified(true)
      setOtpNotice('')
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect code. Please try again.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Changing the email after sending a code restarts the OTP flow
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value })
    if (otpSent) {
      setOtpSent(false)
      setEnteredOtp('')
      setOtpNotice('')
      setOtpError('')
      setCountdown(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!mVerified) {
      setErrorMsg('Please verify your mobile number with the SMS code before creating your account.')
      return
    }
    if (!isVerified) {
      setErrorMsg('Please verify your email address with OTP before creating your account.')
      return
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '')
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.')
      return
    }
    if (role === 'client' && !formData.companyName.trim()) {
      setErrorMsg('Please enter your company name.')
      return
    }
    if (formData.password.length < 8 || !/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setErrorMsg('Password must be at least 8 characters and include a letter and a number.')
      return
    }

    setLoading(true)

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      let res

      if (role === 'client') {
        res = await authApi.registerClient({
          companyName: formData.companyName.trim(),
          contactPerson: fullName,
          email: formData.email.trim(),
          mobile: cleanPhone,
          password: formData.password,
        })
      } else {
        res = await authApi.registerFreelancer({
          fullName: fullName,
          email: formData.email.trim(),
          mobile: cleanPhone,
          password: formData.password,
          skills: domain ? [domain] : [],
        })
      }

      navigate(startSession(res, formData.rememberMe), { replace: true })
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
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
                alt="hunhar.in Logo"
                className="block h-9 w-auto object-contain lg:h-[clamp(26px,4.6vh,42px)]"
              />
            </div>

            {/* Title */}
            <h1 className="m-0 mb-[clamp(8px,1.8vh,18px)] font-makira text-xl font-bold text-[#0F1B3D] lg:text-[clamp(17px,2.5vh,22px)]">
              Create an account on hunhar.in
            </h1>

            {/* Role switch */}
            <div className="mb-[clamp(8px,1.6vh,16px)] grid grid-cols-2 gap-1 rounded-xl bg-[#F1F5F9] p-1" role="tablist" aria-label="Account type">
              {(
                [
                  { value: 'freelancer', label: 'I am a Freelancer', icon: UserRound },
                  { value: 'client', label: 'I want to Hire', icon: Briefcase },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={role === opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`flex h-[clamp(30px,4.6vh,40px)] cursor-pointer items-center justify-center gap-1.5 rounded-lg border-none text-[11.5px] font-bold transition-all ${role === opt.value ? 'bg-[#08182B] text-white shadow-sm' : 'bg-transparent text-[#64748B] hover:text-[#0F1B3D]'}`}
                >
                  <opt.icon size={14} />
                  {opt.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 lg:gap-[clamp(6px,1.4vh,14px)]"
            >
              {/* Company (clients only) */}
              {role === 'client' && (
                <div>
                  <label className={labelClass}>Company Name</label>
                  <input
                    type="text"
                    placeholder="Your company or brand"
                    maxLength={150}
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              )}

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

              {/* Mobile Number + Send OTP */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Mobile Number</label>
                  {mVerified && (
                    <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-green-600">
                      <CheckCircle2 size={13} className="text-green-600" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B]">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      placeholder="10-digit Mobile Number"
                      value={formData.phone}
                      disabled={mVerified}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      required
                      className={`${inputClass} pl-10 ${mVerified ? 'bg-green-50/50 border-green-300 font-semibold' : ''}`}
                    />
                  </div>
                  {!mVerified && (
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={mCountdown > 0 || mSending}
                      className="h-[clamp(32px,5vh,44px)] shrink-0 cursor-pointer rounded-lg border border-[#D6DCE5] bg-white px-3 text-[11px] font-bold text-[#C06B3E] transition-all hover:border-[#C06B3E] hover:bg-[#FAF4EE] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mSending ? (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw size={12} className="animate-spin" /> Sending
                        </span>
                      ) : mCountdown > 0 ? `Resend (${mCountdown}s)` : mOtpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {mError && !mOtpSent && <p className="mt-1.5 text-[11px] font-bold text-red-600">{mError}</p>}
              </div>

              {mOtpSent && !mVerified && (
                <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3 text-left shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#C06B3E]" />
                    <span className="text-[12px] font-bold text-[#9A3412]">SMS Code Sent</span>
                  </div>
                  {mNotice && <p className="mt-1 text-[11px] text-[#7C2D12]">{mNotice}</p>}
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      aria-label="SMS verification code"
                      value={mOtp}
                      onChange={(e) => setMOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleVerifyMobileOtp()
                        }
                      }}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#D6DCE5] bg-white px-3 font-mono text-sm font-bold tracking-widest text-[#0F1B3D] outline-none focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMobileOtp}
                      disabled={mVerifying}
                      className="h-10 shrink-0 cursor-pointer rounded-lg bg-[#08182B] px-4 text-xs font-bold text-white transition-all hover:bg-[#C06B3E] active:scale-95 disabled:opacity-60"
                    >
                      {mVerifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                  {mError && <p className="mt-1.5 text-[11px] font-bold text-red-600">{mError}</p>}
                </div>
              )}

              {/* Email + Send OTP */}
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Email Address</label>
                  {isVerified && (
                    <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-green-600">
                      <CheckCircle2 size={13} className="text-green-600" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    disabled={isVerified}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                    className={`${inputClass} ${isVerified ? 'bg-green-50/50 border-green-300 font-semibold' : ''}`}
                  />
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0 || sendingOtp}
                      className="h-[clamp(32px,5vh,44px)] shrink-0 cursor-pointer rounded-lg border border-[#D6DCE5] bg-white px-3 text-[11px] font-bold text-[#C06B3E] transition-all hover:border-[#C06B3E] hover:bg-[#FAF4EE] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingOtp ? (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw size={12} className="animate-spin" /> Sending
                        </span>
                      ) : countdown > 0 ? `Resend (${countdown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  )}
                </div>
                {otpError && !otpSent && (
                  <p className="mt-1.5 text-[11px] font-bold text-red-600">{otpError}</p>
                )}
              </div>

              {/* OTP Verification Box */}
              {otpSent && !isVerified && (
                <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3 text-left shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#C06B3E]" />
                    <span className="text-[12px] font-bold text-[#9A3412]">Verification Code Sent</span>
                  </div>
                  {otpNotice && <p className="mt-1 text-[11px] text-[#7C2D12]">{otpNotice}</p>}

                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleVerifyOtp()
                        }
                      }}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-[#D6DCE5] bg-white px-3 font-mono text-sm font-bold tracking-widest text-[#0F1B3D] outline-none focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp}
                      className="h-10 shrink-0 cursor-pointer rounded-lg bg-[#08182B] px-4 text-xs font-bold text-white transition-all hover:bg-[#C06B3E] active:scale-95 disabled:opacity-60"
                    >
                      {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                  {otpError && (
                    <p className="mt-1.5 text-[11px] font-bold text-red-600">{otpError}</p>
                  )}
                </div>
              )}

              {/* Verified Confirmation Banner */}
              {isVerified && (
                <div className="flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 p-2.5 text-center text-xs font-bold text-green-700">
                  <CheckCircle2 size={15} className="text-green-600" />
                  Email address verified successfully!
                </div>
              )}

              {/* Password */}
              <div>
                <label className={labelClass}>Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters, letters and numbers"
                    minLength={8}
                    autoComplete="new-password"
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

              {/* Remember Me & Terms */}
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
                <span className="text-[11px] text-[#718096]">
                  Encrypted via AES-256
                </span>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="rounded-lg bg-red-50 p-2.5 text-center text-xs font-semibold text-red-600 border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-[clamp(34px,5.4vh,46px)] w-full cursor-pointer rounded-lg border-none bg-[#08182B] text-xs font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#12294A] disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E2E8F0]" />
                <span className="text-[10px] text-[#64748B]">or</span>
                <div className="h-px flex-1 bg-[#E2E8F0]" />
              </div>

              {/* Google Button */}
              <GoogleAuthButton
                role={role === 'client' ? 'CLIENT' : 'FREELANCER'}
                label={role === 'client' ? 'Sign up as Client with Google' : 'Sign up as Freelancer with Google'}
                onError={setErrorMsg}
              />

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