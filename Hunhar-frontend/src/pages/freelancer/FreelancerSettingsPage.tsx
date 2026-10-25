import React, { useState, useRef, useEffect } from 'react'
import {
  User,
  Briefcase,
  Shield,
  Camera,
  Check,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  Trash2,
  Plus,
  Coins,
  DollarSign,
  Building,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ImageCropModal from '../../components/common/ImageCropModal'
import { fileUrl, filesApi, profileApi, tokenStorage, walletApi, type FreelancerProfile } from '../../services/api'
import { formatINR, initials } from '../../services/format'

type FreelancerSettingsTab =
  | 'Profile & Skills'
  | 'Payout & Wallet'
  | 'Notifications'
  | 'Security'

const dataUrlToFile = async (dataUrl: string, name: string): Promise<File> => {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], name, { type: blob.type || 'image/png' })
}

export default function FreelancerSettingsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FreelancerSettingsTab>('Profile & Skills')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [profile, setProfile] = useState<FreelancerProfile | null>(null)
  const [wallet, setWallet] = useState<{ availableBalance: number; escrowBalance: number; totalEarned: number } | null>(null)
  const [tempCropImage, setTempCropImage] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile & Professional State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [professionalTitle, setProfessionalTitle] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [collegeUniversity, setCollegeUniversity] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [degreeField, setDegreeField] = useState('')
  const [location, setLocation] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [githubBehance, setGithubBehance] = useState('')
  const [availability, setAvailability] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  // Payout Details (account number / PAN are write-only: the server only returns masked values)
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [autoWithdrawal, setAutoWithdrawal] = useState(false)

  // Notification Preferences
  const [notifyNewProjectInvites, setNotifyNewProjectInvites] = useState(true)
  const [notifyBidUpdates, setNotifyBidUpdates] = useState(true)
  const [notifyClientMessages, setNotifyClientMessages] = useState(true)
  const [notifyPayoutProcessed, setNotifyPayoutProcessed] = useState(true)
  const [notifyCreditsReminder, setNotifyCreditsReminder] = useState(true)
  const [notifyMarketingDigest, setNotifyMarketingDigest] = useState(false)

  // Security Passwords
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const fillForm = (p: FreelancerProfile) => {
    setProfile(p)
    setFullName(p.fullName || '')
    setEmail(p.email || '')
    setPhone(p.mobile || '')
    setProfessionalTitle(p.professionalTitle || '')
    setHourlyRate(p.hourlyRate != null ? String(p.hourlyRate) : '')
    setCollegeUniversity(p.collegeUniversity || '')
    setGraduationYear(p.graduationYear ? String(p.graduationYear) : '')
    setDegreeField(p.degreeField || '')
    setLocation(p.location || '')
    setPortfolioUrl(p.portfolioUrl || '')
    setGithubBehance(p.githubUrl || '')
    setAvailability(p.availability || '')
    setBio(p.bio || '')
    setSkills(p.skills || [])
    setPayoutMethod(p.payout?.method === 'BANK' ? 'bank' : 'upi')
    setUpiId(p.payout?.upiId || '')
    setAccountHolder(p.payout?.accountHolder || p.fullName || '')
    setBankName(p.payout?.bankName || '')
    setIfscCode(p.payout?.ifscCode || '')
    setAccountNumber('')
    setPanNumber('')
    setAutoWithdrawal(!!p.payout?.autoWithdrawal)
    const prefs = p.notificationPrefs || {}
    setNotifyNewProjectInvites(prefs.projectInvites ?? true)
    setNotifyBidUpdates(prefs.bidUpdates ?? true)
    setNotifyClientMessages(prefs.clientMessages ?? true)
    setNotifyPayoutProcessed(prefs.payoutProcessed ?? true)
    setNotifyCreditsReminder(prefs.creditsReminder ?? true)
    setNotifyMarketingDigest(prefs.marketingDigest ?? false)
  }

  useEffect(() => {
    // Remove details older versions of this page kept in the browser (they included bank info)
    try {
      localStorage.removeItem('hunhar_freelancer_profile_custom')
    } catch {
      // storage unavailable
    }
    Promise.allSettled([profileApi.getMine(), walletApi.getMyWallet()]).then(([p, w]) => {
      if (p.status === 'fulfilled') fillForm(p.value)
      else flash('error', p.reason?.message || 'Could not load your settings')
      if (w.status === 'fulfilled') setWallet(w.value)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flash = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text })
    window.setTimeout(() => setNotice(null), 4500)
  }

  const syncStoredUser = (p: FreelancerProfile) => {
    const currentUser = tokenStorage.getUser() || {}
    tokenStorage.setUser({ ...currentUser, fullName: p.fullName, avatarUrl: p.avatarUrl })
    window.dispatchEvent(new Event('hunhar:profile-updated'))
  }

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    e.preventDefault()
    const s = newSkill.trim()
    if (!s) return
    if (skills.length >= 30) return flash('error', 'You can add up to 30 skills.')
    if (!skills.some((x) => x.toLowerCase() === s.toLowerCase())) setSkills([...skills, s.slice(0, 50)])
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  const saveAvatar = async (croppedDataUrl: string) => {
    setUploadingAvatar(true)
    try {
      const stored = await filesApi.upload(await dataUrlToFile(croppedDataUrl, 'avatar.png'))
      const updated = await profileApi.update({ avatarUrl: stored.url })
      setProfile(updated)
      syncStoredUser(updated)
      flash('success', 'Profile photo updated.')
    } catch (err: any) {
      flash('error', err.message || 'Could not upload your photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfileTab = async () => {
    if (fullName.trim().length < 2) return flash('error', 'Please enter your full name.')
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone && cleanPhone.length !== 10) return flash('error', 'Phone number must be 10 digits.')
    const rate = hourlyRate.trim() === '' ? undefined : Number(hourlyRate)
    if (rate !== undefined && (!Number.isFinite(rate) || rate < 0)) return flash('error', 'Hourly rate must be a positive number.')
    const year = graduationYear.trim() === '' ? undefined : Number(graduationYear)
    if (year !== undefined && (!Number.isInteger(year) || year < 1950 || year > 2100)) return flash('error', 'Enter a valid graduation year.')

    const updated = await profileApi.update({
      fullName: fullName.trim(),
      ...(cleanPhone ? { mobile: cleanPhone } : {}),
      professionalTitle,
      ...(rate !== undefined ? { hourlyRate: rate } : {}),
      collegeUniversity,
      ...(year !== undefined ? { graduationYear: year } : {}),
      degreeField,
      location,
      portfolioUrl,
      githubUrl: githubBehance,
      availability,
      bio,
      skills,
    })
    fillForm(updated)
    syncStoredUser(updated)
    flash('success', 'Profile saved.')
  }

  const savePayoutTab = async () => {
    const updated = await profileApi.updatePayout({
      method: payoutMethod === 'upi' ? 'UPI' : 'BANK',
      upiId: payoutMethod === 'upi' ? upiId.trim() : '',
      accountHolder: accountHolder.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.replace(/\s/g, ''),
      ifscCode: ifscCode.trim().toUpperCase(),
      panNumber: panNumber.trim().toUpperCase(),
      autoWithdrawal,
    })
    fillForm(updated)
    flash('success', 'Payout details saved securely.')
  }

  const saveNotificationTab = async () => {
    await profileApi.updateNotificationPrefs({
      projectInvites: notifyNewProjectInvites,
      bidUpdates: notifyBidUpdates,
      clientMessages: notifyClientMessages,
      payoutProcessed: notifyPayoutProcessed,
      creditsReminder: notifyCreditsReminder,
      marketingDigest: notifyMarketingDigest,
    })
    flash('success', 'Notification preferences saved.')
  }

  const handleChangePassword = async () => {
    if (!currentPassword) return flash('error', 'Enter your current password.')
    if (newPassword.length < 8) return flash('error', 'New password must be at least 8 characters.')
    if (newPassword !== confirmPassword) return flash('error', 'New passwords do not match.')
    setSaving(true)
    try {
      await profileApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      flash('success', 'Password changed. Use it the next time you log in.')
    } catch (err: any) {
      flash('error', err.message || 'Could not change the password')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      if (activeTab === 'Profile & Skills') await saveProfileTab()
      else if (activeTab === 'Payout & Wallet') await savePayoutTab()
      else if (activeTab === 'Notifications') await saveNotificationTab()
    } catch (err: any) {
      flash('error', err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] w-full items-center justify-center rounded-[24px] bg-white p-8">
        <span className="font-manrope text-[15px] font-semibold text-[#8E8376]">Loading your settings…</span>
      </div>
    )
  }

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching Hunhar Design System */}
      <div className="w-full min-h-[820px] rounded-[24px] bg-white p-6 sm:p-9 lg:p-10 shadow-xs border border-[#E9EBEF]/60 flex flex-col">
        {/* Top Tag: Icon + Freelancer Settings */}
        <div className="mb-4 flex items-center gap-2 font-manrope text-[14px] font-semibold text-[#64748B]">
          <User size={17} className="text-[#C06B3E]" />
          <span>Freelancer Settings</span>
        </div>

        {/* Page Title & Subtitle */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#08182B]">
              Settings
            </h1>
            <p className="mt-1 font-manrope text-[13.5px] text-[#7A7065]">
              Manage your profile, skills, payout methods, notifications, and security
            </p>
          </div>

          {notice && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-[12px] px-4 py-2 text-[13px] font-bold shadow-xs ${
                notice.type === 'success' ? 'bg-[#EBF7EE] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
              }`}
            >
              {notice.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{notice.text}</span>
            </div>
          )}
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="mt-7 flex flex-wrap items-center gap-6 sm:gap-9 border-b border-[#F0ECE6] pb-0">
          {(
            [
              'Profile & Skills',
              'Payout & Wallet',
              'Notifications',
              'Security',
            ] as FreelancerSettingsTab[]
          ).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-3 font-manrope text-[14px] transition-colors cursor-pointer ${isActive
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
        {/* TAB 1: PROFILE & SKILLS */}
        {/* ========================================================= */}
        {activeTab === 'Profile & Skills' && (
          <form onSubmit={handleSave} className="mt-8 flex flex-col space-y-8">
            {/* Avatar & Verification Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-[20px] border border-[#EBE6DF] bg-[#FAF8F5] p-5 sm:p-6">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
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

              {/* Clickable Profile Avatar with Camera Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer"
                title="Click to change profile picture"
              >
                {profile?.avatarUrl ? (
                  <img
                    src={fileUrl(profile.avatarUrl)}
                    alt={fullName}
                    className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md transition-opacity group-hover:opacity-85"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white bg-[#C06B3E] text-[24px] font-extrabold text-white shadow-md">
                    {initials(fullName)}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">Uploading…</div>
                )}
                <div
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#A95A30]"
                  aria-label="Upload Avatar"
                >
                  <Camera size={14} />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
                    {fullName}
                  </h3>
                  {profile?.kycStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                      <Check size={12} strokeWidth={3} />
                      KYC Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[11px] font-bold text-[#B45309]">
                      {profile?.kycStatus === 'PENDING_REVIEW' ? 'KYC under review' : 'KYC not verified'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] text-[#7A7065]">
                  Click the avatar to upload your picture (PNG, JPG). Shows on bids, search results, and client project rooms.
                  {profile?.profileCompletion !== undefined && (
                    <> Profile {profile.profileCompletion}% complete — <Link to="/freelancer/profile" className="font-bold text-[#C06B3E]">view profile</Link>.</>
                  )}
                </p>
              </div>
            </div>

            {/* Profile Form Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Full Name
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

              {/* Professional Title */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Professional Title / Role
                </label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    placeholder="e.g. Brand & UI/UX Designer"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    aria-readonly="true"
                    title="Your login email can't be changed here"
                    className="w-full cursor-not-allowed rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-[13.5px] text-[#64748B] outline-none"
                  />
                </div>
                <p className="mt-1 text-[11.5px] text-[#7A7065]">Verified login email — contact support to change it.</p>
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
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* College / University */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  College / University
                </label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={collegeUniversity}
                    onChange={(e) => setCollegeUniversity(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Degree / Branch */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Degree & Major
                </label>
                <input
                  type="text"
                  value={degreeField}
                  onChange={(e) => setDegreeField(e.target.value)}
                  className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Base Hourly Rate (₹ / hr)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#64748B]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Weekly Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                >
                  <option>Available (10-20 hrs/week)</option>
                  <option>Available (20-30 hrs/week)</option>
                  <option>Available Full-Time (30+ hrs/week)</option>
                  <option>Currently Busy with Exams</option>
                  <option>Not Available</option>
                </select>
              </div>

              {/* Portfolio URL */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Portfolio / Personal Website
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Behance / GitHub */}
              <div>
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Behance / Dribbble / GitHub
                </label>
                <div className="relative">
                  <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="url"
                    value={githubBehance}
                    onChange={(e) => setGithubBehance(e.target.value)}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Location (City, State, Country)
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

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  About Me / Bio
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-[14px] border border-[#E5E7EB] bg-white p-3.5 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                />
                <p className="mt-1 text-[12px] text-[#7A7065]">
                  Introduce your skills, approach, and what kind of projects excite you.
                </p>
              </div>

              {/* Skills Tags */}
              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                  Skills & Tools
                </label>
                <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#E5E7EB] bg-white p-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-3 py-1 text-[12.5px] font-bold text-[#C06B3E]"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#C06B3E] hover:text-[#94441F] cursor-pointer"
                        aria-label={`Remove ${skill}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-2 min-w-[140px] flex-1">
                    <input
                      type="text"
                      placeholder="Add a skill & press Enter..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={handleAddSkill}
                      className="w-full text-[13px] text-[#08182B] outline-none placeholder:text-[#94A3B8]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="rounded-lg bg-[#C06B3E] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#AA572D] transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE6]">
              <button
                type="button"
                onClick={() => profile && fillForm(profile)}
                disabled={saving}
                className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[13.5px] font-bold text-[#08182B] hover:bg-[#FAF8F5] transition-colors shadow-2xs"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#AA572D] transition-colors shadow-sm disabled:opacity-60"
              >
                <Save size={16} />
                <span>{saving ? 'Saving…' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PAYOUT & WALLET */}
        {/* ========================================================= */}
        {activeTab === 'Payout & Wallet' && (
          <form onSubmit={handleSave} className="mt-8 flex flex-col space-y-8">
            {/* Wallet Quick Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="rounded-[20px] border border-[#EBE6DF] bg-gradient-to-br from-[#FFF9F3] to-[#FAF8F5] p-5">
                <div className="flex items-center justify-between text-[#C06B3E]">
                  <span className="text-[12px] font-bold uppercase tracking-wider">Available Balance</span>
                  <Coins size={18} />
                </div>
                <div className="mt-3 text-[26px] font-black text-[#08182B]">
                  {wallet ? formatINR(wallet.availableBalance, { decimals: true }) : '—'}
                </div>
                <p className="mt-1 text-[11.5px] text-[#7A7065]">
                  Ready to withdraw from your <Link to="/freelancer/wallet" className="font-bold text-[#C06B3E]">wallet</Link>
                </p>
              </div>

              <div className="rounded-[20px] border border-[#EBE6DF] bg-[#FAF8F5] p-5">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-[12px] font-bold uppercase tracking-wider">In Escrow (Active)</span>
                  <Clock size={18} />
                </div>
                <div className="mt-3 text-[26px] font-black text-[#08182B]">
                  {wallet ? formatINR(wallet.escrowBalance, { decimals: true }) : '—'}
                </div>
                <p className="mt-1 text-[11.5px] text-[#7A7065]">
                  Released upon milestone client sign-off
                </p>
              </div>

              <div className="rounded-[20px] border border-[#EBE6DF] bg-[#FAF8F5] p-5">
                <div className="flex items-center justify-between text-[#16A34A]">
                  <span className="text-[12px] font-bold uppercase tracking-wider">Lifetime Earned</span>
                  <Sparkles size={18} />
                </div>
                <div className="mt-3 text-[26px] font-black text-[#08182B]">
                  {wallet ? formatINR(wallet.totalEarned, { decimals: true }) : '—'}
                </div>
                <p className="mt-1 text-[11.5px] text-[#7A7065]">
                  Across {profile?.completedProjects ?? 0} completed project{profile?.completedProjects === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {/* Payout Method Selector */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6">
              <h3 className="text-[16px] font-bold text-[#08182B] mb-1">
                Preferred Payout Destination
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-5">
                Withdrawals are sent here. Account number and PAN are stored encrypted and shown masked.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <label
                  onClick={() => setPayoutMethod('upi')}
                  className={`flex items-start gap-3.5 p-4 rounded-[16px] border-2 cursor-pointer transition-all ${payoutMethod === 'upi'
                    ? 'border-[#C06B3E] bg-[#FFF9F3]'
                    : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    checked={payoutMethod === 'upi'}
                    onChange={() => setPayoutMethod('upi')}
                    className="mt-1 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-[#08182B]">UPI Instant Transfer</span>
                      <span className="rounded-full bg-[#EBF7EE] px-2 py-0.5 text-[10.5px] font-bold text-[#16A34A]">
                        Instant (0-5 min)
                      </span>
                    </div>
                    <p className="text-[12px] text-[#7A7065] mt-0.5">
                      Direct to Google Pay, PhonePe, Paytm, or BHIM VPA
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPayoutMethod('bank')}
                  className={`flex items-start gap-3.5 p-4 rounded-[16px] border-2 cursor-pointer transition-all ${payoutMethod === 'bank'
                    ? 'border-[#C06B3E] bg-[#FFF9F3]'
                    : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
                    }`}
                >
                  <input
                    type="radio"
                    name="payoutMethod"
                    checked={payoutMethod === 'bank'}
                    onChange={() => setPayoutMethod('bank')}
                    className="mt-1 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[14px] text-[#08182B]">Direct Bank Transfer (NEFT / IMPS)</span>
                    </div>
                    <p className="text-[12px] text-[#7A7065] mt-0.5">
                      Direct deposit to your Indian savings account
                    </p>
                  </div>
                </label>
              </div>

              {/* UPI Form */}
              {payoutMethod === 'upi' && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                      UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                      Full Name as in Bank Account
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </div>
                </div>
              )}

              {/* Bank Account Form */}
              {payoutMethod === 'bank' && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2">
                  <div>
                    <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="password"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30 uppercase"
                    />
                  </div>
                </div>
              )}

              {/* Tax Information (PAN) */}
              <div className="mt-6 pt-5 border-t border-[#F0ECE6] grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    PAN Card Number (For TDS Compliance)
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    maxLength={10}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder={profile?.payout?.panMasked ? `Saved: ${profile.payout.panMasked} (type to replace)` : 'ABCDE1234F'}
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30 uppercase"
                  />
                  <p className="mt-1 text-[11.5px] text-[#7A7065]">
                    Required by RBI / Income Tax Dept for student earnings exceeding exemption slabs.
                  </p>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoWithdrawal}
                      onChange={(e) => setAutoWithdrawal(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                    />
                    <div>
                      <span className="text-[13px] font-bold text-[#08182B] block">
                        Auto-withdraw earnings weekly (coming soon)
                      </span>
                      <span className="text-[12px] text-[#7A7065] block">
                        Your choice is saved now and will apply when automatic withdrawals launch
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE6]">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#AA572D] transition-colors shadow-sm disabled:opacity-60"
              >
                <Save size={16} />
                <span>{saving ? 'Saving…' : 'Save Payout Settings'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NOTIFICATIONS */}
        {/* ========================================================= */}
        {activeTab === 'Notifications' && (
          <form onSubmit={handleSave} className="mt-8 flex flex-col space-y-6">
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6">
              <h3 className="text-[16px] font-bold text-[#08182B] mb-1">
                Project & Opportunity Alerts
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-6">
                Choose how and when you receive real-time notifications about clients and bids.
              </p>

              <div className="space-y-4">
                {/* 1. Direct Client Invites */}
                <div className="flex items-center justify-between py-2 border-b border-[#F5F2EC]">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#08182B]">
                      Direct Project Invitations
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      When a client specifically requests a proposal from you
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyNewProjectInvites}
                    onChange={(e) => setNotifyNewProjectInvites(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                </div>

                {/* 2. Bid Status */}
                <div className="flex items-center justify-between py-2 border-b border-[#F5F2EC]">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#08182B]">
                      Bid Status Updates & Shortlists
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      Get notified when a client accepts, shortlists, or declines your bid
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyBidUpdates}
                    onChange={(e) => setNotifyBidUpdates(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                </div>

                {/* 3. Messages */}
                <div className="flex items-center justify-between py-2 border-b border-[#F5F2EC]">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#08182B]">
                      Instant Client Messages
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      Receive email and push alerts for new project room messages
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyClientMessages}
                    onChange={(e) => setNotifyClientMessages(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                </div>

                {/* 4. Payouts */}
                <div className="flex items-center justify-between py-2 border-b border-[#F5F2EC]">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#08182B]">
                      Payment & Milestone Releases
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      Notifications when funds are released from escrow to your wallet
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyPayoutProcessed}
                    onChange={(e) => setNotifyPayoutProcessed(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                </div>

                {/* 5. Credits */}
                <div className="flex items-center justify-between py-2 border-b border-[#F5F2EC]">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#08182B]">
                      Credits & Purchases
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      Alerts when credits are added or running low
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyCreditsReminder}
                    onChange={(e) => setNotifyCreditsReminder(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                </div>

                {/* 6. Digest */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#08182B]">
                      Weekly Curated Freelancer Digest
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      Top matching projects, student leaderboard rankings, and earning tips
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMarketingDigest}
                    onChange={(e) => setNotifyMarketingDigest(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#C06B3E] focus:ring-[#C06B3E]"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0ECE6]">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#AA572D] transition-colors shadow-sm disabled:opacity-60"
              >
                <Save size={16} />
                <span>{saving ? 'Saving…' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SECURITY & ACCESS */}
        {/* ========================================================= */}
        {activeTab === 'Security' && (
          <form onSubmit={handleSave} className="mt-8 flex flex-col space-y-8">
            {/* Password Change */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6">
              <h3 className="text-[16px] font-bold text-[#08182B] mb-1">
                Change Account Password
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-6">
                Protect your freelancer profile and earnings by maintaining a strong password.
              </p>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Current Password */}
                <div>
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-4 pr-10 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#08182B]"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 pl-4 pr-10 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#08182B]"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[13px] font-bold text-[#08182B] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-[14px] border border-[#E5E7EB] bg-white py-2.5 px-4 text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="rounded-[10px] bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#11243E] transition-colors disabled:opacity-60"
                >
                  {saving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#EBE6DF] bg-[#FAF8F5] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C06B3E]">
                  <Shield size={22} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#08182B]">Account security</h4>
                  <p className="mt-1 max-w-xl text-[12.5px] text-[#7A7065]">
                    Your email was verified with a one-time code at signup. Payout details are encrypted, and you are logged out automatically when your session expires.
                    To close your account, message Hunhar support.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* LinkedIn-style Image Crop Modal */}
      {tempCropImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={tempCropImage}
          title="Adjust Profile Picture"
          aspectRatio="circle"
          onClose={() => {
            setIsCropModalOpen(false)
            setTempCropImage(null)
          }}
          onSave={(croppedUrl) => {
            saveAvatar(croppedUrl)
          }}
        />
      )}
    </div>
  )
}
