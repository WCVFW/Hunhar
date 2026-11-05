import React, { useEffect, useState } from 'react'
import { Shield, Percent, Check, Save, Coins, Plus } from 'lucide-react'
import { adminApi, type CreditPackageAdmin, type PlatformSettings } from '../../services/api'
import { formatINR } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner } from './adminUi'

const inputClass = 'w-full rounded-xl border border-[#E5DACD] p-2.5 text-xs text-[#08182B] focus:border-[#C06B3E] focus:outline-none'

const NUMBER_FIELDS: { key: keyof PlatformSettings; label: string; hint: string; suffix?: string }[] = [
  { key: 'commissionPercent', label: 'Platform Commission (%)', hint: 'Deducted from each milestone payment released to the freelancer (0–50).' },
  { key: 'autoApproveDays', label: 'Auto-Approve Submitted Work (Days)', hint: 'If the client neither approves nor asks for changes within this many days.' },
  { key: 'creditsPerBid', label: 'Credits Per Proposal', hint: 'Credits a freelancer spends to send one proposal (0 = free).' },
  { key: 'starterCredits', label: 'Free Starter Credits', hint: 'Credits every new freelancer gets once.' },
  { key: 'minPayout', label: 'Minimum Withdrawal (₹)', hint: 'Smallest amount a freelancer can withdraw from the wallet.' },
]

type PackageDraft = Omit<CreditPackageAdmin, 'id'> & { id?: string }

export default function AdminSettingsPage(): React.JSX.Element {
  const settingsQuery = useAdminData(() => adminApi.getSettings())
  const packagesQuery = useAdminData(() => adminApi.packages())

  const [form, setForm] = useState<PlatformSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [pkgDraft, setPkgDraft] = useState<PackageDraft | null>(null)
  const [pkgError, setPkgError] = useState('')
  const [pkgSaving, setPkgSaving] = useState(false)

  useEffect(() => {
    if (settingsQuery.data) setForm(settingsQuery.data)
  }, [settingsQuery.data])

  const handleSave = async () => {
    if (!form || !settingsQuery.data) return
    const changes: Partial<Record<keyof PlatformSettings, string>> = {}
    ;(Object.keys(form) as (keyof PlatformSettings)[]).forEach((k) => {
      if (String(form[k]) !== String(settingsQuery.data![k])) changes[k] = String(form[k]).trim()
    })
    if (!Object.keys(changes).length) {
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const updated = await adminApi.updateSettings(changes)
      settingsQuery.setData(updated)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setSaveError(err.message || 'Could not save the settings')
    } finally {
      setSaving(false)
    }
  }

  const savePackage = async () => {
    if (!pkgDraft) return
    if (!pkgDraft.name.trim() || pkgDraft.credits <= 0 || pkgDraft.priceInInr <= 0) {
      setPkgError('Give the package a name, and credits and price above zero.')
      return
    }
    setPkgSaving(true)
    setPkgError('')
    try {
      await adminApi.savePackage({ ...pkgDraft, name: pkgDraft.name.trim() })
      setPkgDraft(null)
      await packagesQuery.reload()
    } catch (err: any) {
      setPkgError(err.message || 'Could not save the package')
    } finally {
      setPkgSaving(false)
    }
  }

  const toggleActive = async (pkg: CreditPackageAdmin) => {
    setPkgError('')
    try {
      await adminApi.savePackage({ ...pkg, active: !pkg.active })
      await packagesQuery.reload()
    } catch (err: any) {
      setPkgError(err.message || 'Could not update the package')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl font-manrope">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">System & Platform Governance Settings</h1>
        <p className="text-sm text-[#8E8376]">Marketplace economics, payout rules and credit packages. Changes apply immediately.</p>
      </div>

      <ErrorBanner message={settingsQuery.error} onRetry={settingsQuery.reload} />
      <ErrorBanner message={saveError} />
      {saved && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Check size={16} />
          Settings saved. All services use the new values from now on.
        </div>
      )}

      {!form ? (
        settingsQuery.loading && <LoadingBlock label="Loading settings…" />
      ) : (
        <>
          <div className="rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F0EAE1] pb-3">
              <Percent size={18} className="text-[#C06B3E]" />
              <h2 className="text-base font-bold text-[#08182B]">Platform Monetization & Escrow Timing</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {NUMBER_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-[#08182B] block mb-1" htmlFor={f.key}>
                    {f.label}
                  </label>
                  <input
                    id={f.key}
                    type="number"
                    min={0}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-[11px] text-[#8E8376] mt-1">{f.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#F0EAE1] pb-3">
              <Shield size={18} className="text-[#C06B3E]" />
              <h2 className="text-base font-bold text-[#08182B]">Security & Compliance Safeguards</h2>
            </div>
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD] cursor-pointer">
              <div>
                <p className="text-xs font-bold text-[#08182B]">Mandatory KYC for Payout Withdrawals</p>
                <p className="text-[11px] text-[#8E8376]">Freelancers cannot withdraw wallet earnings until their Aadhaar KYC is approved.</p>
              </div>
              <input
                type="checkbox"
                checked={form.kycRequiredForPayout === 'true'}
                onChange={(e) => setForm({ ...form, kycRequiredForPayout: e.target.checked ? 'true' : 'false' })}
                className="h-4 w-4 accent-[#C06B3E] cursor-pointer"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D98F62] to-[#C06B3E] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-105 transition-all disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? 'Saving…' : 'Save System Configuration'}
            </button>
          </div>
        </>
      )}

      {/* Credit packages */}
      <div className="rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-[#C06B3E]" />
            <h2 className="text-base font-bold text-[#08182B]">Credit Packages</h2>
          </div>
          <button
            type="button"
            onClick={() => setPkgDraft({ name: '', credits: 10, priceInInr: 100, active: true })}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E5DACD] bg-white px-3 py-1.5 text-xs font-bold text-[#08182B] hover:bg-[#F8F4EE]"
          >
            <Plus size={13} /> New Package
          </button>
        </div>

        <ErrorBanner message={packagesQuery.error} onRetry={packagesQuery.reload} />
        <ErrorBanner message={pkgError} />

        {pkgDraft && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end rounded-xl bg-[#F8F4EE] border border-[#E5DACD] p-3">
            <div>
              <label className="text-[11px] font-bold text-[#08182B]">Name</label>
              <input value={pkgDraft.name} onChange={(e) => setPkgDraft({ ...pkgDraft, name: e.target.value })} className={inputClass} placeholder="Starter" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#08182B]">Credits</label>
              <input type="number" min={1} value={pkgDraft.credits} onChange={(e) => setPkgDraft({ ...pkgDraft, credits: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#08182B]">Price (₹)</label>
              <input type="number" min={1} value={pkgDraft.priceInInr} onChange={(e) => setPkgDraft({ ...pkgDraft, priceInInr: Number(e.target.value) })} className={inputClass} />
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={pkgSaving} onClick={savePackage} className="flex-1 rounded-xl bg-[#08182B] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                {pkgSaving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setPkgDraft(null)} className="rounded-xl border border-[#E5DACD] bg-white px-3 py-2.5 text-xs font-bold text-[#08182B]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {packagesQuery.loading && !packagesQuery.data ? (
          <p className="text-xs text-[#8E8376]">Loading packages…</p>
        ) : !packagesQuery.data?.length ? (
          <p className="text-xs text-[#8E8376]">No credit packages yet. Freelancers cannot buy credits until you add one.</p>
        ) : (
          <div className="divide-y divide-[#F0EAE1]">
            {packagesQuery.data.map((pkg) => (
              <div key={pkg.id} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <p className="text-sm font-bold text-[#08182B]">
                    {pkg.name} {!pkg.active && <span className="ml-1 text-[10px] font-bold text-gray-500">(hidden)</span>}
                  </p>
                  <p className="text-xs text-[#8E8376]">
                    {pkg.credits} credits · {formatINR(pkg.priceInInr)} ({formatINR(pkg.priceInInr / pkg.credits, { decimals: true })}/credit)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setPkgDraft(pkg)} className="rounded-lg border border-[#E5DACD] bg-white px-2.5 py-1 text-[11px] font-bold text-[#08182B] hover:bg-[#F8F4EE]">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(pkg)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                      pkg.active ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {pkg.active ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
