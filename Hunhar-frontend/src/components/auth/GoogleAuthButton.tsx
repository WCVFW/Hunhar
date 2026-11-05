import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Loader2, UserRound } from 'lucide-react'
import { authApi, startSession, type AuthResult } from '../../services/api'
import { GoogleCancelledError, getGoogleAccessToken, preloadGoogle } from '../../services/googleAuth'

type Role = 'FREELANCER' | 'CLIENT'

interface Props {
  /** Known on the signup page (from the role switch); on login it is asked only for brand-new accounts. */
  role?: Role
  label?: string
  onError: (message: string) => void
}

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
)

export default function GoogleAuthButton({ role, label = 'Continue with Google', onError }: Props): React.JSX.Element {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<{ accessToken: string; profile: AuthResult } | null>(null)
  const [chosenRole, setChosenRole] = useState<Role>('FREELANCER')
  const [companyName, setCompanyName] = useState('')
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    preloadGoogle()
  }, [])

  const finish = (res: AuthResult) => navigate(startSession(res), { replace: true })

  const handleClick = async () => {
    onError('')
    setBusy(true)
    try {
      const accessToken = await getGoogleAccessToken()
      const res = await authApi.google({ accessToken, role })
      if (res.needsRole) {
        setPending({ accessToken, profile: res })
        setCompanyName('')
        setModalError('')
      } else {
        finish(res)
      }
    } catch (err: any) {
      if (!(err instanceof GoogleCancelledError)) onError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const createAccount = async () => {
    if (!pending) return
    if (chosenRole === 'CLIENT' && !companyName.trim()) return setModalError('Please enter your company name.')
    setBusy(true)
    setModalError('')
    try {
      finish(await authApi.google({ accessToken: pending.accessToken, role: chosenRole, companyName: companyName.trim() || undefined }))
    } catch (err: any) {
      setModalError(err.message || 'Could not create your account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex h-[clamp(34px,5.4vh,46px)] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#CFE4FF] text-xs font-semibold text-[#1A56C4] transition-colors hover:bg-[#BFDAFB] disabled:cursor-wait disabled:opacity-70"
      >
        {busy && !pending ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
        {label}
      </button>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="google-role-title">
          <div className="w-full max-w-md rounded-[20px] bg-white p-6 text-left shadow-xl">
            <h2 id="google-role-title" className="m-0 text-[17px] font-bold text-[#0F1B3D]">
              Welcome, {pending.profile.fullName.split(' ')[0]}!
            </h2>
            <p className="mt-1 text-[12.5px] text-[#64748B]">
              No Hunhar account uses {pending.profile.email} yet. How do you want to use Hunhar?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'FREELANCER', title: 'Freelancer', hint: 'Find work and get paid', icon: UserRound },
                  { value: 'CLIENT', title: 'Client', hint: 'Hire talent for projects', icon: Briefcase },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChosenRole(opt.value)}
                  aria-pressed={chosenRole === opt.value}
                  className={`flex flex-col items-start rounded-[14px] border-2 p-3 text-left transition-colors ${chosenRole === opt.value ? 'border-[#C06B3E] bg-[#FFF7ED]' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}`}
                >
                  <opt.icon size={18} className={chosenRole === opt.value ? 'text-[#C06B3E]' : 'text-[#64748B]'} />
                  <span className="mt-2 text-[13px] font-bold text-[#0F1B3D]">{opt.title}</span>
                  <span className="text-[11px] text-[#64748B]">{opt.hint}</span>
                </button>
              ))}
            </div>
            {chosenRole === 'CLIENT' && (
              <label className="mt-4 block text-[11px] font-semibold text-[#334155]">
                Company Name
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={150}
                  placeholder="Your company or brand"
                  className="mt-1 h-10 w-full rounded-lg border border-[#D6DCE5] px-3 text-xs outline-none focus:border-[#C06B3E]"
                />
              </label>
            )}
            {modalError && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600">{modalError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" disabled={busy} onClick={() => setPending(null)} className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-xs font-semibold text-[#64748B]">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={createAccount} className="flex items-center gap-2 rounded-lg bg-[#08182B] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
