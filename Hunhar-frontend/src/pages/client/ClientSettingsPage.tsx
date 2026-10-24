import React, { useState, useRef } from 'react'
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
  Smartphone,
  Trash2,
  Plus,
} from 'lucide-react'
import ImageCropModal from '../../components/common/ImageCropModal'

type SettingsTab = 'Company Profile' | 'Notifications' | 'Billing & Invoicing' | 'Security'

export default function ClientSettingsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('Company Profile')
  const [savedNotice, setSavedNotice] = useState<boolean>(false)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)
  const [tempCropImage, setTempCropImage] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Company / Personal Profile State
  const [fullName, setFullName] = useState('Alex Morgan')
  const [email, setEmail] = useState('alex.morgan@orbitstudios.com')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [companyName, setCompanyName] = useState('Orbit Studios')
  const [industry, setIndustry] = useState('Digital Media & Marketing')
  const [companySize, setCompanySize] = useState('11-50 Employees')
  const [website, setWebsite] = useState('https://orbitstudios.io')
  const [location, setLocation] = useState('Bangalore, India')
  const [aboutCompany, setAboutCompany] = useState(
    'Orbit Studios is a brand innovation collective designing next-generation digital products, high-impact marketing visuals, and interactive experiences.'
  )

  // Notification Preferences
  const [notifyNewBids, setNotifyNewBids] = useState(true)
  const [notifyMilestones, setNotifyMilestones] = useState(true)
  const [notifyMessages, setNotifyMessages] = useState(true)
  const [notifyPaymentReceipts, setNotifyPaymentReceipts] = useState(true)
  const [notifyMarketing, setNotifyMarketing] = useState(false)

  // Billing Details
  const [taxId, setTaxId] = useState('GSTIN33ABCDE1234F1Z5')
  const [billingAddress, setBillingAddress] = useState('1204, Indiranagar 100ft Road, Bangalore, KA 560038')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

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
                    OM
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
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
                  <option>Digital Media & Marketing</option>
                  <option>Software & SaaS</option>
                  <option>E-commerce & Retail</option>
                  <option>Fintech & Finance</option>
                  <option>Healthcare & Biotech</option>
                  <option>Design & Creative Services</option>
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
                    type="url"
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
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 cursor-pointer"
              >
                <Save size={16} />
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
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 cursor-pointer"
              >
                <Save size={16} />
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
            {/* Primary Payment Method */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                  Payment Methods
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#08182B] shadow-2xs hover:bg-[#F8FAFC]"
                >
                  <Plus size={14} />
                  <span>Add Method</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[16px] border border-[#E5E7EB] bg-[#FAF8F5] p-4 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#08182B] text-white">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">
                      HDFC Corporate Card •••• 4821
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">Expires 08/29 · Primary method for milestone funding</p>
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
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    Official Invoicing & Billing Address
                  </label>
                  <textarea
                    rows={3}
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
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13.5px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.4)] transition-all hover:bg-[#A95A30] active:scale-98 cursor-pointer"
              >
                <Save size={16} />
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
                    placeholder="Confirm new password"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13px] outline-none focus:border-[#C06B3E]"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-[10px] bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#1A2E44] transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[20px] border border-[#EBE6DF] bg-white p-6 shadow-xs gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EBF7EE] text-[#16A34A]">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-[12.5px] text-[#7A7065]">
                    Adds an extra verification step during login via Authenticator app or SMS.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="rounded-[10px] border border-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-[#C06B3E] hover:bg-[#FAF3EB] transition-colors"
              >
                Enable 2FA
              </button>
            </div>

            {/* Danger Zone: Close / Deactivate Account */}
            <div className="rounded-[20px] border border-[#FEE2E2] bg-[#FEF2F2]/50 p-6">
              <h3 className="font-manrope text-[15px] font-bold text-[#EF4444] mb-1">
                Danger Zone
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-4">
                Closing your client account will cancel any draft projects, release active contracts, and delete your company data permanently.
              </p>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#EF4444] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#DC2626] transition-colors shadow-2xs"
              >
                <Trash2 size={14} />
                <span>Deactivate Client Account</span>
              </button>
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
            setCompanyLogo(croppedUrl)
          }}
        />
      )}
    </div>
  )
}
