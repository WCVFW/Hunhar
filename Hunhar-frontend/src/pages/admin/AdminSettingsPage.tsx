import React, { useState } from 'react'
import {
  Shield,
  Percent,
  Check,
  Save,
} from 'lucide-react'


export default function AdminSettingsPage(): React.JSX.Element {
  const [commissionRate, setCommissionRate] = useState('10')
  const [autoEscrowDays, setAutoEscrowDays] = useState('7')
  const [kycMandatory, setKycMandatory] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-4xl font-manrope">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">
          System & Platform Governance Settings
        </h1>
        <p className="text-sm text-[#8E8376]">
          Configure core marketplace economics, dispute time limits, escrow rules, and security controls.
        </p>
      </div>

      {saved && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <Check size={16} />
          Configuration saved and synced to platform microservices!
        </div>
      )}

      {/* Economics Card */}
      <div className="rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F0EAE1] pb-3">
          <Percent size={18} className="text-[#C06B3E]" />
          <h2 className="text-base font-bold text-[#08182B]">Platform Monetization & Escrow Timing</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-[#08182B] block mb-1">
              Platform Take Rate / Commission (%)
            </label>
            <input
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full rounded-xl border border-[#E5DACD] p-2.5 text-xs text-[#08182B] focus:border-[#C06B3E] focus:outline-none"
            />
            <p className="text-[11px] text-[#8E8376] mt-1">
              Standard marketplace fee subtracted automatically upon milestone release.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#08182B] block mb-1">
              Auto-Release Inactivity Period (Days)
            </label>
            <input
              type="number"
              value={autoEscrowDays}
              onChange={(e) => setAutoEscrowDays(e.target.value)}
              className="w-full rounded-xl border border-[#E5DACD] p-2.5 text-xs text-[#08182B] focus:border-[#C06B3E] focus:outline-none"
            />
            <p className="text-[11px] text-[#8E8376] mt-1">
              If client does not approve or request revisions after submission within this window.
            </p>
          </div>
        </div>
      </div>

      {/* Security & KYC Rules Card */}
      <div className="rounded-[20px] bg-white p-6 border border-[#E5DACD] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F0EAE1] pb-3">
          <Shield size={18} className="text-[#C06B3E]" />
          <h2 className="text-base font-bold text-[#08182B]">Security & Compliance Safeguards</h2>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
            <div>
              <p className="text-xs font-bold text-[#08182B]">Mandatory KYC for Payout Withdrawals</p>
              <p className="text-[11px] text-[#8E8376]">
                Freelancers cannot withdraw wallet earnings without Aadhaar/PAN verification.
              </p>
            </div>
            <input
              type="checkbox"
              checked={kycMandatory}
              onChange={(e) => setKycMandatory(e.target.checked)}
              className="h-4 w-4 accent-[#C06B3E] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
            <div>
              <p className="text-xs font-bold text-[#08182B]">Automated Contact Info & External Link Filter</p>
              <p className="text-[11px] text-[#8E8376]">
                Automatically hide phone numbers, emails, and external payment links in project chat proposals.
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-[#C06B3E] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D98F62] to-[#C06B3E] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-105 transition-all"
        >
          <Save size={15} />
          Save System Configuration
        </button>
      </div>
    </div>
  )
}
