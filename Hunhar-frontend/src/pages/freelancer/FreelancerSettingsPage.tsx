import React, { useState, useRef } from 'react'
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Briefcase,
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
  Coins,
  DollarSign,
  Building,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  Layers,
} from 'lucide-react'
import vikashImg from '../../assets/vikash.jpg'
import ImageCropModal from '../../components/common/ImageCropModal'

type FreelancerSettingsTab =
  | 'Profile & Skills'
  | 'Payout & Wallet'
  | 'Notifications'
  | 'Security'

export default function FreelancerSettingsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FreelancerSettingsTab>('Profile & Skills')
  const [savedNotice, setSavedNotice] = useState<boolean>(false)
  const [profileImage, setProfileImage] = useState<string>(vikashImg)
  const [tempCropImage, setTempCropImage] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile & Professional State
  const [fullName, setFullName] = useState('Rajshankar.M')
  const [email, setEmail] = useState('Rajshankar.designer@hunhar.com')
  const [phone, setPhone] = useState('+91 98450 12345')
  const [professionalTitle, setProfessionalTitle] = useState('Brand & UI/UX Designer')
  const [hourlyRate, setHourlyRate] = useState('850')
  const [collegeUniversity, setCollegeUniversity] = useState('Annamalai University, Chindambaram')
  const [graduationYear, setGraduationYear] = useState('2026')
  const [degreeField, setDegreeField] = useState('B.Tech - Computer Science & Design')
  const [location, setLocation] = useState('Chennai, Tamil Nadu, India')
  const [portfolioUrl, setPortfolioUrl] = useState('https://arunkumar.design')
  const [githubBehance, setGithubBehance] = useState('https://behance.net/arunkumardesign')
  const [availability, setAvailability] = useState('Available (20-30 hrs/week)')
  const [bio, setBio] = useState(
    "Passionate student UI/UX & Brand Designer with experience designing modern SaaS products, clean visual identities, and interactive mobile apps. Looking for challenging freelance projects to build my portfolio and collaborate with fast-moving startups."
  )

  // Skills
  const [skills, setSkills] = useState<string[]>([
    'UI/UX Design',
    'Figma',
    'Webflow',
    'Graphic Design',
    'Brand Identity',
    'React',
    'Tailwind CSS',
  ])
  const [newSkill, setNewSkill] = useState('')

  // Payout Details
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('arunkumar@okhdfcbank')
  const [accountHolder, setAccountHolder] = useState('Arun Kumar S')
  const [bankName, setBankName] = useState('HDFC Bank Ltd')
  const [accountNumber, setAccountNumber] = useState('50100492817294')
  const [ifscCode, setIfscCode] = useState('HDFC0001234')
  const [panNumber, setPanNumber] = useState('ABCDE1234F')
  const [autoWithdrawal, setAutoWithdrawal] = useState(true)

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
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return
    e.preventDefault()
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
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
              Manage your student profile, skills, payout methods, notifications, and security
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-2 rounded-[12px] bg-[#EBF7EE] px-4 py-2 text-[13px] font-bold text-[#16A34A] animate-fade-in shadow-xs">
              <Check size={16} />
              <span>Settings updated successfully!</span>
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
                <img
                  src={profileImage}
                  alt={fullName}
                  className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md transition-opacity group-hover:opacity-85"
                />
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                    <Check size={12} strokeWidth={3} />
                    Student Verified
                  </span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-[#7A7065]">
                  Click the avatar or camera icon to upload your picture (PNG, JPG). Shows on bids, search results, and client project rooms.
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
                className="rounded-[12px] border border-[#E5E7EB] bg-white px-5 py-2.5 text-[13.5px] font-bold text-[#08182B] hover:bg-[#FAF8F5] transition-colors shadow-2xs"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#AA572D] transition-colors shadow-sm"
              >
                <Save size={16} />
                <span>Save Profile</span>
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
                  ₹24,850.00
                </div>
                <p className="mt-1 text-[11.5px] text-[#7A7065]">
                  Ready for instant withdrawal to bank / UPI
                </p>
              </div>

              <div className="rounded-[20px] border border-[#EBE6DF] bg-[#FAF8F5] p-5">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span className="text-[12px] font-bold uppercase tracking-wider">In Escrow (Active)</span>
                  <Clock size={18} />
                </div>
                <div className="mt-3 text-[26px] font-black text-[#08182B]">
                  ₹18,500.00
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
                  ₹1,42,200.00
                </div>
                <p className="mt-1 text-[11.5px] text-[#7A7065]">
                  Over 16 completed student contracts
                </p>
              </div>
            </div>

            {/* Payout Method Selector */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6">
              <h3 className="text-[16px] font-bold text-[#08182B] mb-1">
                Preferred Payout Destination
              </h3>
              <p className="text-[12.5px] text-[#7A7065] mb-5">
                Earnings are credited directly with 0% platform withdrawal fee for verified students.
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
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
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
                        Auto-withdraw earnings every Friday
                      </span>
                      <span className="text-[12px] text-[#7A7065] block">
                        Automatically transfer available balance above ₹1,000
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
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#AA572D] transition-colors shadow-sm"
              >
                <Save size={16} />
                <span>Save Payout Settings</span>
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
                      Monthly Free Bid Credits Refill
                    </h4>
                    <p className="text-[12px] text-[#7A7065]">
                      Alert when your monthly student bid credits are reset or low
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
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#C06B3E] px-6 py-2.5 text-[13.5px] font-bold text-white hover:bg-[#AA572D] transition-colors shadow-sm"
              >
                <Save size={16} />
                <span>Save Preferences</span>
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
                  className="rounded-[10px] bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#11243E] transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication (2FA) */}
            <div className="rounded-[20px] border border-[#EBE6DF] bg-white p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C06B3E] shrink-0">
                    <Shield size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15px] font-bold text-[#08182B]">
                        Two-Factor Authentication (2FA)
                      </h4>
                      <span className="rounded-full bg-[#EBF7EE] px-2.5 py-0.5 text-[11px] font-bold text-[#16A34A]">
                        Active
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#7A7065] mt-1 max-w-xl">
                      Requires an SMS OTP or Google Authenticator code when signing in or withdrawing earnings to UPI.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-[12.5px] font-bold text-[#08182B] hover:bg-[#FAF8F5] transition-colors shrink-0"
                >
                  {twoFactorAuth ? 'Reconfigure 2FA' : 'Enable 2FA'}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-[20px] border border-[#FEE2E2] bg-[#FFF5F5] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[15px] font-bold text-[#DC2626]">
                    Deactivate or Delete Freelancer Account
                  </h4>
                  <p className="text-[12.5px] text-[#991B1B]/80 mt-1 max-w-xl">
                    Once deactivated, your student profile, ratings, and portfolio will no longer appear on client searches. Active escrow balances must be withdrawn first.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-[12px] bg-[#DC2626] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#B91C1C] transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                  <span>Deactivate Account</span>
                </button>
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
            setProfileImage(croppedUrl)
          }}
        />
      )}
    </div>
  )
}
