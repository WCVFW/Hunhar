import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Camera,
  Check,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  Lock,
  Loader2,
  Wallet,
} from 'lucide-react'
import ImageCropModal from '../../components/common/ImageCropModal'
import { clientApi, fileUrl, filesApi, profileApi, tokenStorage, walletApi, type ClientProfile } from '../../services/api'
import { formatINR } from '../../services/format'

type SettingsTab = 'Company Profile' | 'Notifications' | 'Billing & Invoicing' | 'Security'

export default function ClientSettingsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Company Profile')
  const [savedNotice, setSavedNotice] = useState<boolean>(false)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [tempCropImage, setTempCropImage] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [errorNotice, setErrorNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Company / Personal Profile State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [website, setWebsite] = useState('')
  const [location, setLocation] = useState('')
  const [aboutCompany, setAboutCompany] = useState('')

  // Notification Preferences
  const [notifyNewBids, setNotifyNewBids] = useState(true)
  const [notifyMilestones, setNotifyMilestones] = useState(true)
  const [notifyMessages, setNotifyMessages] = useState(true)
  const [notifyPaymentReceipts, setNotifyPaymentReceipts] = useState(true)
  const [notifyMarketing, setNotifyMarketing] = useState(false)

  // Billing Details
  const [taxId, setTaxId] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [wallet, setWallet] = useState<{ availableBalance: number; escrowBalance: number } | null>(null)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const apply = (p: ClientProfile) => {
    setFullName(p.fullName || '')
    setEmail(p.email || '')
    setPhone(p.mobile || '')
    setCompanyName(p.companyName || '')
    setIndustry(p.industry || '')
    setCompanySize(p.companySize || '')
    setWebsite(p.website || '')
    setLocation(p.location || '')
    setAboutCompany(p.companyDescription || '')
    setTaxId(p.gstin || '')
    setBillingAddress(p.billingAddress || '')
    setCompanyLogo(p.avatarUrl ? fileUrl(p.avatarUrl) : null)
    const n = p.notificationPrefs || {}
    setNotifyNewBids(n.newBids ?? true)
    setNotifyMilestones(n.milestones ?? true)
    setNotifyMessages(n.messages ?? true)
    setNotifyPaymentReceipts(n.paymentReceipts ?? true)
    setNotifyMarketing(n.marketing ?? false)
    const current = tokenStorage.getUser() || {}
    tokenStorage.setUser({ ...current, fullName: p.fullName, avatarUrl: p.avatarUrl })
    window.dispatchEvent(new Event('hunhar:profile-updated'))
  }

  useEffect(() => {
    clientApi
      .getProfile()
      .then(apply)
      .catch((e) => setErrorNotice(e.message || 'Could not load your settings'))
      .finally(() => setLoaded(true))
    walletApi
      .getMyWallet()
      .then((w) => setWallet({ availableBalance: Number(w.availableBalance), escrowBalance: Number(w.escrowBalance) }))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flashSaved = () => {
    setErrorNotice('')
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  const run = async (fn: () => Promise<void>) => {
    setSaving(true)
    setErrorNotice('')
    try {
      await fn()
      flashSaved()
    } catch (err: any) {
      setErrorNotice(err.message || 'Could not save your changes')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (fullName.trim().length < 2) return setErrorNotice('Please enter the contact person name.')
    if (!companyName.trim()) return setErrorNotice('Company name is required.')
    const mobile = phone.replace(/\D/g, '').slice(-10)
    if (phone && mobile.length !== 10) return setErrorNotice('Phone number must be 10 digits.')
    run(async () =>
      apply(
        await clientApi.updateProfile({
          fullName: fullName.trim(),
          ...(mobile ? { mobile } : {}),
          companyName: companyName.trim(),
          industry,
          companySize,
          website: website.trim(),
          location: location.trim(),
          companyDescription: aboutCompany.trim(),
        })
      )
    )
  }

  const saveNotifications = () =>
    run(async () =>
      apply(
        await clientApi.updateProfile({
          notificationPrefs: {
            newBids: notifyNewBids,
            milestones: notifyMilestones,
            messages: notifyMessages,
            paymentReceipts: notifyPaymentReceipts,
            marketing: notifyMarketing,
          },
        })
      )
    )

  const saveBilling = () =>
    run(async () => apply(await clientApi.updateProfile({ gstin: taxId.trim(), billingAddress: billingAddress.trim() })))

  const saveLogo = (croppedDataUrl: string) =>
    run(async () => {
      const blob = await (await fetch(croppedDataUrl)).blob()
      const stored = await filesApi.upload(new File([blob], 'logo.png', { type: blob.type || 'image/png' }))
      apply(await clientApi.updateProfile({ avatarUrl: stored.url }))
    })

  const updatePassword = () => {
    if (!currentPassword) return setErrorNotice('Enter your current password.')
    if (newPassword.length < 8) return setErrorNotice('New password must be at least 8 characters.')
    if (newPassword !== confirmPassword) return setErrorNotice('New passwords do not match.')
    run(async () => {
      await profileApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    })
  }

  const logoInitials = (companyName || fullName || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching Hunhar Design System */}
      <div className="w-full min-h-[820px] rounded-[24px] bg-white p-6 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* Top Tag: Icon + Client Settings */}
        <div className="mb-4 flex items-center gap-2 font-manrope text-[14px] font-semibold text-[#64748B]">
          <Building2 size={17} />
          <span>Client Settings</span>
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#08182B]">
              Settings
            </h1>
            <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">
              Manage your company information, billing, team, and security preferences
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-2 rounded-[12px] bg-[#EBF7EE] px-4 py-2 text-[13px] font-bold text-[#16A34A] animate-fade-in">
              <Check size={16} />
              <span>Settings saved successfully!</span>
            </div>
          )}
        </div>

        {errorNotice && (
          <div role="alert" className="mt-5 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">
            {errorNotice}
          </div>
        )}
        {!loaded && <p className="mt-5 text-[13px] text-[#7A7065]">Loading your settings…</p>}

        {/* Horizontal Navigation Tabs */}
        <div className="mt-7 flex flex-wrap items-center gap-6 sm:gap-9 border-b border-[#F0ECE6] pb-0">
          {(
            [
              'Company Profile',
              'Notifications',
              'Billing & Invoicing',
              'Security',
            ] as SettingsTab[]
          ).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 font-manrope text-[14px] transition-colors cursor-pointer ${
                  isActive
                    ? 'font-bold text-[#C06B3E]'
                    : 'font-medium text-[#7A7065] hover:text-[#08182B]'
                }`}
              >
                <span>{tab}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-[#C06B3E]" />
                )}
              </button>
            )
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: COMPANY / CLIENT PROFILE */}
        {/* ========================================================= */}
        {activeTab === 'Company Profile' && (
          <form onSubmit={handleSave} className="mt-8 flex flex-col space-y-8">
            {/* Logo / Avatar Upload Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-[20px] border border-[#EBE6DF] bg-[#FAF8F5] p-5 sm:p-6">
              {/* Hidden file input */}
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setTempCropImage(reader.result)
                        setIsCropModalOpen(true)
                      }
                    }
                    reader.readAsDataURL(file)
                  }
                  e.target.value = ''
                }}
              />

              {/* Clickable Logo Avatar with Camera Button */}
              <div
                onClick={() => logoInputRef.current?.click()}
                className="relative group cursor-pointer"
                title="Click to change company logo"
              >
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md transition-opacity group-hover:opacity-85"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#08182B] text-[24px] font-extrabold text-white shadow-md transition-opacity group-hover:opacity-85">
                    {logoInitials}
                  </div>
                )}
                <div
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#A95A30]"
                  aria-label="Upload Company Logo"
                >
                  <Camera size={14} />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                  Company Logo & Avatar
                </h3>
                <p className="mt-0.5 text-[12.5px] text-[#7A7065]">
                  Click the avatar or camera icon to upload your logo (PNG, JPG). Shows on job posts, bids, and contracts.
                </p>
              </div>
            </div>

            {/* Profile Form Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Contact Person Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    title="Your login email cannot be changed here"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Industry / Domain
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                >
                  <option value="">Select industry</option>
                  <option>Digital Media & Marketing</option>
                  <option>Software & SaaS</option>
                  <option>E-commerce & Retail</option>
                  <option>Fintech & Finance</option>
                  <option>Healthcare & Biotech</option>
                  <option>Design & Creative Services</option>
                  <option>Education & E-learning</option>
                  <option>Manufacturing</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Company Size
                </label>
                <select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                >
                  <option value="">Select size</option>
                  <option>1-10 Employees (Startup)</option>
                  <option>11-50 Employees</option>
                  <option>51-200 Employees</option>
                  <option>201-500 Employees</option>
                  <option>500+ Enterprise</option>
                </select>
              </div>

              {/* Website */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Company Website
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="https://yourcompany.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Headquarters Location
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="City, State"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* About Company */}
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  About Company / Bio
                </label>
                <textarea
                  rows={4}
                  maxLength={3000}
                  placeholder="Tell freelancers about your company and the kind of work you hire for"
                  value={aboutCompany}
                  onChange={(e) => setAboutCompany(e.target.value)}
                  className="w-full rounded-[14px] border border-[#E5E7EB] bg-white p-3.5 text-[13.5px] leading-relaxed text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                />
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="flex justify-end pt-4 border-t border-[#F0ECE6]">
              <button
                type="submit"
                disabled={saving || !loaded}
                className="disabled:opacity-60 inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 cursor-pointer"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 2: NOTIFICATIONS PREFERENCES */}
        {/* ========================================================= */}
        {activeTab === 'Notifications' && (
          <div className="mt-8 flex flex-col space-y-6">
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B] mb-1">
                Project & Proposal Alerts
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-5">
                Choose what updates you want to receive immediately via email and app alerts.
              </p>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer py-2 border-b border-[#F5F2ED]">
                  <div>
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">New Proposals & Bids</span>
                    <p className="text-[12px] text-[#7A7065]">Get notified when top hustlers submit proposals on your projects</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyNewBids}
                    onChange={(e) => setNotifyNewBids(e.target.checked)}
                    className="h-5 w-5 accent-[#C06B3E] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-2 border-b border-[#F5F2ED]">
                  <div>
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">Milestone Submissions</span>
                    <p className="text-[12px] text-[#7A7065]">Alert when a freelancer submits milestone work for review or approval</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMilestones}
                    onChange={(e) => setNotifyMilestones(e.target.checked)}
                    className="h-5 w-5 accent-[#C06B3E] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-2 border-b border-[#F5F2ED]">
                  <div>
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">Direct Chat Messages</span>
                    <p className="text-[12px] text-[#7A7065]">Instant alert when freelancers message you on active workspaces</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMessages}
                    onChange={(e) => setNotifyMessages(e.target.checked)}
                    className="h-5 w-5 accent-[#C06B3E] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-2 border-b border-[#F5F2ED]">
                  <div>
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">Payment Receipts & Invoices</span>
                    <p className="text-[12px] text-[#7A7065]">Email receipt whenever an escrow milestone is released or funded</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyPaymentReceipts}
                    onChange={(e) => setNotifyPaymentReceipts(e.target.checked)}
                    className="h-5 w-5 accent-[#C06B3E] rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-2">
                  <div>
                    <span className="font-manrope text-[14px] font-bold text-[#08182B]">Platform Updates & Newsletters</span>
                    <p className="text-[12px] text-[#7A7065]">Feature releases, community showcases and product tips</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMarketing}
                    onChange={(e) => setNotifyMarketing(e.target.checked)}
                    className="h-5 w-5 accent-[#C06B3E] rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveNotifications}
                disabled={saving || !loaded}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Notification Preferences</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BILLING & INVOICING */}
        {/* ========================================================= */}
        {activeTab === 'Billing & Invoicing' && (
          <div className="mt-8 flex flex-col space-y-6">
            {/* Wallet used for milestone funding */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                  Payment Method
                </h3>
                <Link
                  to="/client/payments"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#08182B] no-underline shadow-2xs hover:bg-[#F8FAFC]"
                >
                  <CreditCard size={14} />
                  <span>Add Funds</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[16px] border border-[#E5E7EB] bg-[#FAF8F5] p-4 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#08182B] text-white">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">
                      Hunhar Wallet · {wallet ? formatINR(wallet.availableBalance) : '…'} available
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      {wallet ? `${formatINR(wallet.escrowBalance)} held in escrow · ` : ''}Top up via UPI, card or net banking (Razorpay)
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                  Default
                </span>
              </div>
            </div>

            {/* Invoicing & Tax Details */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B] mb-1">
                Invoicing & Legal Entity Details
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-5">
                These details will be printed on all Hunhar tax invoices for GST compliance.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    GSTIN / Tax ID Number
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 33ABCDE1234F1Z5"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    Official Invoicing & Billing Address
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white p-3.5 text-[13.5px] leading-relaxed text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveBilling}
                disabled={saving || !loaded}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Save Invoicing Details</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SECURITY & ACCOUNT */}
        {/* ========================================================= */}
        {activeTab === 'Security' && (
          <div className="mt-8 flex flex-col space-y-6">
            {/* Change Password */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs">
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B] mb-1">
                Password & Authentication
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-5">
                Ensure your client account is guarded with a strong password.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#08182B] mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13px] outline-none focus:border-[#C06B3E]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#08182B] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13px] outline-none focus:border-[#C06B3E]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#08182B] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13px] outline-none focus:border-[#C06B3E]"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={updatePassword}
                  disabled={saving}
                  className="disabled:opacity-60 rounded-[10px] bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#1A2E44] transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Login verification */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EBF7EE] text-[#16A34A]">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                    Verified Email Login
                  </h4>
                  <p className="text-[12.5px] text-[#7A7065]">
                    {email ? `${email} is verified. ` : ''}Password resets and new sign-ups are confirmed with a one-time code sent to this email.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#EBF7EE] px-3 py-1 text-[12px] font-bold text-[#16A34A]">Active</span>
            </div>

            {/* Danger Zone */}
            <div className="rounded-[20px] border border-[#FEE2E2] bg-[#FEF2F2]/50 p-6">
              <h3 className="font-manrope text-[15px] font-bold text-[#EF4444] mb-1">
                Danger Zone
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-4">
                Account closure is handled by the Hunhar team so active contracts and escrow funds can be settled first. Cancel any open projects from My Projects, then contact support.
              </p>

              <a
                href="mailto:support@hunhar.in?subject=Close%20my%20client%20account"
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#EF4444] px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:bg-[#DC2626] transition-colors shadow-2xs"
              >
                <Lock size={14} />
                <span>Request Account Closure</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* LinkedIn-style Company Logo Crop Modal */}
      {tempCropImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={tempCropImage}
          title="Adjust Company Logo"
          aspectRatio="circle"
          onClose={() => {
            setIsCropModalOpen(false)
            setTempCropImage(null)
          }}
          onSave={(croppedUrl) => {
            saveLogo(croppedUrl)
          }}
        />
      )}
    </div>
  )
}
