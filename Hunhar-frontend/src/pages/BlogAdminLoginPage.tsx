import React, { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { blogApi, getSessionRole, startSession } from '../services/api'

/** Sign-in for the blog dashboard (SEO / content team accounts). */
export default function BlogAdminLoginPage(): React.JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(params.get('expired') ? 'Your session expired. Please sign in again.' : '')

  const role = getSessionRole()
  if (role === 'EDITOR' || role === 'ADMIN') return <Navigate to="/blog-admin" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setBusy(true)
    setError('')
    try {
      const res = await blogApi.login(email.trim(), password)
      startSession(res, true)
      navigate('/blog-admin', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white overflow-x-clip">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="p-2 sm:p-4 lg:p-5 2xl:p-6 bg-[#0A1B37]">
          <div className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-[#FDFBF7] bg-[radial-gradient(circle,#E8DFC9_1.1px,transparent_1.1px)] [background-size:32px_32px] pt-28 sm:pt-32 pb-20 px-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hunhar SEO &amp; Content Management System</span>
              </div>
              <h1 className="text-center text-2xl sm:text-3xl font-medium font-makira uppercase tracking-wide text-navy">
                SEO Writer Login
              </h1>
              <p className="text-center text-xs sm:text-sm text-slate-500 mt-1 mb-8">
                Sign in to write and publish articles on the Hunhar blog.
              </p>

              <form onSubmit={submit} className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.08] shadow-sm space-y-5">
                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div>
                  <label htmlFor="blog-email" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    id="blog-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@hunhar.in"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#FDFBF7] text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                  />
                </div>
                <div>
                  <label htmlFor="blog-password" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="blog-password"
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-black/10 bg-[#FDFBF7] text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy bg-transparent border-none cursor-pointer p-0"
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-bold text-sm hover:brightness-105 shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
