import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Edit3,
  MapPin,
  Globe,
  Star,
  Award,
  Camera,
  Code2,
  Trash2,
  X,
  Plus,
  ExternalLink,
  ImagePlus,
  AlertCircle,
} from 'lucide-react'
import ImageCropModal from '../../components/common/ImageCropModal'
import {
  fileUrl,
  filesApi,
  profileApi,
  tokenStorage,
  type FreelancerProfile,
  type PortfolioItem,
} from '../../services/api'
import { formatDate, formatINR, initials } from '../../services/format'

const PORTFOLIO_COLORS = ['bg-[#EEF2FF]', 'bg-[#ECFDF5]', 'bg-[#FFFBEB]', 'bg-[#FFF1F2]', 'bg-[#F0F9FF]', 'bg-[#FDF4FF]']

const inputClass =
  'w-full rounded-[10px] border border-[#CBD5E1] px-3 py-1.5 font-manrope text-[13px] text-[#08182B] focus:border-[#C06B3E] focus:outline-none'

interface EditDraft {
  fullName: string
  professionalTitle: string
  location: string
  bio: string
  portfolioUrl: string
  githubUrl: string
  hourlyRate: string
  availability: string
  skills: string[]
}

const draftFrom = (p: FreelancerProfile): EditDraft => ({
  fullName: p.fullName || '',
  professionalTitle: p.professionalTitle || '',
  location: p.location || '',
  bio: p.bio || '',
  portfolioUrl: p.portfolioUrl || '',
  githubUrl: p.githubUrl || '',
  hourlyRate: p.hourlyRate != null ? String(p.hourlyRate) : '',
  availability: p.availability || '',
  skills: p.skills || [],
})

const dataUrlToFile = async (dataUrl: string, name: string): Promise<File> => {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], name, { type: blob.type || 'image/png' })
}

const prettyUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const rankBadge = (rank?: number) => {
  if (!rank) return 'New Freelancer'
  if (rank <= 10) return `Top 10 Freelancer · Rank #${rank}`
  if (rank <= 50) return `Top Rated · Rank #${rank}`
  return `Rising Talent · Rank #${rank}`
}

export default function FreelancerProfilePage(): React.JSX.Element {
  const [profile, setProfile] = useState<FreelancerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [saving, setSaving] = useState(false)

  const [tempCropImage, setTempCropImage] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<'avatar' | 'cover' | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Portfolio modal
  const [portfolioModal, setPortfolioModal] = useState(false)
  const [item, setItem] = useState<PortfolioItem>({ title: '' })
  const [itemImageUploading, setItemImageUploading] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [itemError, setItemError] = useState('')
  const itemImageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    profileApi
      .getMine()
      .then(setProfile)
      .catch((err) => setLoadError(err.message || 'Could not load your profile'))
      .finally(() => setLoading(false))
  }, [])

  const flash = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text })
    window.setTimeout(() => setNotice(null), 4000)
  }

  const applyProfile = (p: FreelancerProfile) => {
    setProfile(p)
    const stored = tokenStorage.getUser() || {}
    tokenStorage.setUser({ ...stored, fullName: p.fullName, avatarUrl: p.avatarUrl })
    window.dispatchEvent(new Event('hunhar:profile-updated'))
  }

  // ------------------------------------------------------------- images

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return flash('error', 'Please choose an image file.')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempCropImage(reader.result)
        setIsCropModalOpen(true)
      }
    }
    reader.readAsDataURL(file)
  }

  const saveAvatar = async (croppedDataUrl: string) => {
    setUploadingImage('avatar')
    try {
      const stored = await filesApi.upload(await dataUrlToFile(croppedDataUrl, 'avatar.png'))
      applyProfile(await profileApi.update({ avatarUrl: stored.url }))
      flash('success', 'Profile photo updated.')
    } catch (err: any) {
      flash('error', err.message || 'Could not update your photo')
    } finally {
      setUploadingImage(null)
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return flash('error', 'Please choose an image file.')
    setUploadingImage('cover')
    try {
      const stored = await filesApi.upload(file)
      applyProfile(await profileApi.update({ coverUrl: stored.url }))
      flash('success', 'Cover photo updated.')
    } catch (err: any) {
      flash('error', err.message || 'Could not update the cover')
    } finally {
      setUploadingImage(null)
    }
  }

  // ------------------------------------------------------------- edit

  const startEditing = () => {
    if (!profile) return
    setDraft(draftFrom(profile))
    setIsEditing(true)
  }

  const addSkill = () => {
    const s = newSkill.trim()
    if (!draft || !s) return
    if (draft.skills.some((x) => x.toLowerCase() === s.toLowerCase())) return setNewSkill('')
    if (draft.skills.length >= 30) return flash('error', 'You can add up to 30 skills.')
    setDraft({ ...draft, skills: [...draft.skills, s.slice(0, 50)] })
    setNewSkill('')
  }

  const saveProfile = async () => {
    if (!draft) return
    if (draft.fullName.trim().length < 2) return flash('error', 'Please enter your full name.')
    const rate = draft.hourlyRate.trim() === '' ? undefined : Number(draft.hourlyRate)
    if (rate !== undefined && (!Number.isFinite(rate) || rate < 0)) return flash('error', 'Hourly rate must be a positive number.')
    setSaving(true)
    try {
      const updated = await profileApi.update({
        fullName: draft.fullName.trim(),
        professionalTitle: draft.professionalTitle,
        location: draft.location,
        bio: draft.bio,
        portfolioUrl: draft.portfolioUrl,
        githubUrl: draft.githubUrl,
        availability: draft.availability,
        skills: draft.skills,
        ...(rate !== undefined ? { hourlyRate: rate } : {}),
      })
      applyProfile(updated)
      setIsEditing(false)
      flash('success', 'Profile saved.')
    } catch (err: any) {
      flash('error', err.message || 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------- portfolio

  const openPortfolioModal = () => {
    setItem({ title: '', year: new Date().getFullYear() })
    setItemError('')
    setPortfolioModal(true)
  }

  const uploadItemImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setItemError('Please choose an image file.')
    setItemImageUploading(true)
    try {
      const stored = await filesApi.upload(file)
      setItem((prev) => ({ ...prev, imageUrl: stored.url }))
    } catch (err: any) {
      setItemError(err.message)
    } finally {
      setItemImageUploading(false)
    }
  }

  const savePortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.title.trim()) return setItemError('Please add a project title.')
    setSavingItem(true)
    setItemError('')
    try {
      const saved = await profileApi.addPortfolioItem({ ...item, title: item.title.trim() })
      setProfile((prev) => (prev ? { ...prev, portfolio: [saved, ...prev.portfolio] } : prev))
      setPortfolioModal(false)
      flash('success', 'Project added to your portfolio.')
      profileApi.getMine().then(setProfile).catch(() => {})
    } catch (err: any) {
      setItemError(err.message || 'Could not add the project')
    } finally {
      setSavingItem(false)
    }
  }

  const deletePortfolioItem = async (p: PortfolioItem) => {
    if (!p.id || !window.confirm(`Remove "${p.title}" from your portfolio?`)) return
    try {
      await profileApi.deletePortfolioItem(p.id)
      setProfile((prev) => (prev ? { ...prev, portfolio: prev.portfolio.filter((x) => x.id !== p.id) } : prev))
      profileApi.getMine().then(setProfile).catch(() => {})
    } catch (err: any) {
      flash('error', err.message)
    }
  }

  // ------------------------------------------------------------- render

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center rounded-[24px] bg-white p-8">
        <span className="font-manrope text-[15px] font-semibold text-[#8E8376]">Loading your profile…</span>
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center font-manrope">
        <p className="text-[15px] font-bold text-red-700">{loadError || 'Profile not found'}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-full bg-[#08182B] px-5 py-2 text-[13px] font-bold text-white">
          Try again
        </button>
      </div>
    )
  }

  const verified = profile.kycStatus === 'VERIFIED'
  const hasReviews = profile.completedProjects > 0 && profile.rating > 0
  const completion = profile.profileCompletion ?? 0

  return (
    <div className="w-full font-manrope">
      <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" />

      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {notice && (
          <div
            role="status"
            className={`mb-5 rounded-[12px] border p-3 text-[13px] font-semibold ${
              notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
          {/* LEFT 8 COLUMNS */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* 1. Cover & Avatar */}
            <div className="relative">
              <div className="relative h-[160px] sm:h-[195px] w-full overflow-hidden rounded-[22px] bg-gradient-to-r from-[#94A3B8] via-[#FDBA74] to-[#F97316] shadow-inner">
                {profile.coverUrl ? (
                  <img src={fileUrl(profile.coverUrl)} alt="Cover" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#64748B]/30 via-transparent to-white/20" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#EA580C]/25 blur-2xl" />
                    <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-[#FED7AA]/35 blur-3xl" />
                  </>
                )}

                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingImage !== null}
                  className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1.5 font-manrope text-[11.5px] font-semibold text-white backdrop-blur-md transition-all hover:bg-black/80 disabled:opacity-60 shadow-sm"
                >
                  <Camera size={13} className="text-white" />
                  <span>{uploadingImage === 'cover' ? 'Uploading…' : 'Change Cover'}</span>
                </button>
              </div>

              <div className="absolute -bottom-10 left-6 sm:left-8">
                <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-full bg-[#C06B3E] shadow-lg ring-4 ring-white">
                  {profile.avatarUrl ? (
                    <img src={fileUrl(profile.avatarUrl)} alt={profile.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-manrope text-[32px] font-extrabold text-white">{initials(profile.fullName)}</span>
                  )}
                  {uploadingImage === 'avatar' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] font-bold text-white">Uploading…</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingImage !== null}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#C06B3E] text-white shadow-md ring-2 ring-white transition-all hover:bg-[#A95A30] hover:scale-110 disabled:opacity-60"
                  aria-label="Change profile picture"
                >
                  <Camera size={14} />
                </button>
              </div>
            </div>

            {/* 2. Identity */}
            <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex-1">
                {isEditing && draft ? (
                  <div className="flex max-w-md flex-col gap-2">
                    <input
                      type="text"
                      value={draft.fullName}
                      maxLength={100}
                      onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                      placeholder="Your full name"
                      aria-label="Full name"
                      className={inputClass + ' text-[18px] font-bold'}
                    />
                    <input
                      type="text"
                      value={draft.professionalTitle}
                      maxLength={120}
                      onChange={(e) => setDraft({ ...draft, professionalTitle: e.target.value })}
                      placeholder="Headline, e.g. UI/UX Designer & Illustrator"
                      aria-label="Professional title"
                      className={inputClass}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={draft.location}
                        maxLength={120}
                        onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                        placeholder="Location (e.g. Chennai)"
                        aria-label="Location"
                        className={inputClass}
                      />
                      <input
                        type="number"
                        min={0}
                        value={draft.hourlyRate}
                        onChange={(e) => setDraft({ ...draft, hourlyRate: e.target.value })}
                        placeholder="Hourly rate (₹)"
                        aria-label="Hourly rate"
                        className={inputClass}
                      />
                    </div>
                    <input
                      type="text"
                      value={draft.availability}
                      maxLength={120}
                      onChange={(e) => setDraft({ ...draft, availability: e.target.value })}
                      placeholder="Availability (e.g. 20 hrs/week)"
                      aria-label="Availability"
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="font-manrope text-[24px] sm:text-[26px] font-bold text-[#08182B]">{profile.fullName}</h1>
                      {verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#86EFAC] bg-[#F0FDF4] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#16A34A]">
                          <CheckCircle2 size={13} /> KYC Verified
                        </span>
                      ) : (
                        <Link
                          to="/freelancer/settings"
                          className="inline-flex items-center gap-1 rounded-full border border-[#FCD34D] bg-[#FFFBEB] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#B45309] no-underline"
                        >
                          <AlertCircle size={13} /> {profile.kycStatus === 'PENDING_REVIEW' ? 'KYC under review' : 'Not verified'}
                        </Link>
                      )}
                    </div>

                    <p className="mt-1 font-manrope text-[15px] font-medium text-[#64748B]">
                      {profile.professionalTitle || <span className="italic text-[#A0AEC0]">Add a headline so clients know what you do</span>}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[12.5px] text-[#64748B]">
                      {profile.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#94A3B8]" />
                          <span>{profile.location}</span>
                        </div>
                      )}
                      {profile.portfolioUrl && (
                        <div className="flex items-center gap-1.5">
                          <Globe size={14} className="text-[#94A3B8]" />
                          <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-[#64748B] hover:text-[#C06B3E] hover:underline">
                            {prettyUrl(profile.portfolioUrl)}
                          </a>
                        </div>
                      )}
                      {profile.githubUrl && (
                        <div className="flex items-center gap-1.5">
                          <Code2 size={14} className="text-[#94A3B8]" />
                          <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#64748B] hover:text-[#C06B3E] hover:underline">
                            {prettyUrl(profile.githubUrl)}
                          </a>
                        </div>
                      )}
                      {profile.hourlyRate != null && <span className="font-semibold text-[#08182B]">{formatINR(profile.hourlyRate)}/hr</span>}
                      {profile.availability && <span>{profile.availability}</span>}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2.5 sm:items-end">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#C06B3E] px-4 py-2 font-manrope text-[12.5px] font-semibold text-white shadow-xs hover:bg-[#A95A30] disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="rounded-[12px] border border-[#CBD5E1] bg-white px-4 py-2 font-manrope text-[12.5px] font-semibold text-[#08182B]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#CBD5E1] bg-white px-4 py-2 font-manrope text-[12.5px] font-semibold text-[#08182B] shadow-xs transition-all hover:bg-[#F8FAFC]"
                  >
                    <Edit3 size={13} className="text-[#64748B]" />
                    <span>Edit Profile</span>
                  </button>
                )}

                <div className="flex flex-col gap-1.5 sm:items-end">
                  <div className="flex items-center gap-1 text-[13px] font-bold text-[#08182B]">
                    <Star size={14} className={hasReviews ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'} />
                    {hasReviews ? (
                      <>
                        <span>{profile.rating.toFixed(1)}</span>
                        <span className="font-normal text-[#8C9BA8]">
                          ({profile.completedProjects} project{profile.completedProjects === 1 ? '' : 's'})
                        </span>
                      </>
                    ) : (
                      <span className="font-normal text-[#8C9BA8]">No reviews yet</span>
                    )}
                  </div>

                  <Link
                    to="/freelancer/leaderboard"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF5E7] px-3 py-1 font-manrope text-[11px] font-bold text-[#D97706] no-underline"
                  >
                    <Award size={12} />
                    <span>{rankBadge(profile.rank)}</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. About */}
            <div className="mt-2 flex flex-col">
              <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">About</h2>
              {isEditing && draft ? (
                <>
                  <textarea
                    value={draft.bio}
                    maxLength={3000}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                    rows={6}
                    placeholder="Tell clients about your experience, the kind of work you love, and what makes you reliable."
                    className="mt-2.5 w-full rounded-[14px] border border-[#CBD5E1] p-3 font-manrope text-[13.5px] leading-relaxed text-[#4A5568] outline-none focus:border-[#C06B3E]"
                  />
                  <span className="mt-1 text-right text-[11px] text-[#8C9BA8]">{draft.bio.length} / 3000</span>
                </>
              ) : profile.bio ? (
                <div className="mt-2.5 space-y-3 whitespace-pre-line font-manrope text-[13.5px] leading-relaxed text-[#4A5568]">{profile.bio}</div>
              ) : (
                <p className="mt-2.5 text-[13px] italic text-[#A0AEC0]">
                  You haven't written a bio yet.{' '}
                  <button type="button" onClick={startEditing} className="font-bold not-italic text-[#C06B3E] hover:underline">
                    Add one
                  </button>
                </p>
              )}
            </div>

            {/* 4. Links (edit only) */}
            {isEditing && draft && (
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">Portfolio website</h2>
                  <input
                    type="url"
                    value={draft.portfolioUrl}
                    onChange={(e) => setDraft({ ...draft, portfolioUrl: e.target.value })}
                    placeholder="https://behance.net/yourname"
                    className={inputClass + ' mt-2 h-11 px-4'}
                  />
                </div>
                <div>
                  <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">GitHub</h2>
                  <input
                    type="url"
                    value={draft.githubUrl}
                    onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                    placeholder="https://github.com/yourname"
                    className={inputClass + ' mt-2 h-11 px-4'}
                  />
                </div>
              </div>
            )}

            {/* 5. Portfolio projects */}
            <div className="mt-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="font-manrope text-[15px] font-bold text-[#08182B]">Projects</h2>
                <button type="button" onClick={openPortfolioModal} className="font-manrope text-[12.5px] font-bold text-[#C06B3E] hover:underline">
                  + Add Project
                </button>
              </div>

              {profile.portfolio.length === 0 ? (
                <button
                  type="button"
                  onClick={openPortfolioModal}
                  className="mt-3.5 flex h-[150px] w-full flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#E2E8F0] text-[#8C9BA8] transition-colors hover:border-[#C06B3E] hover:text-[#C06B3E]"
                >
                  <Plus size={22} />
                  <span className="text-[13px] font-semibold">Showcase your best work — add your first project</span>
                </button>
              ) : (
                <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profile.portfolio.map((p, i) => (
                    <div
                      key={p.id}
                      className="group relative flex flex-col overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white transition-all duration-200 hover:border-[#D1D5DB] hover:shadow-sm"
                    >
                      {p.imageUrl ? (
                        <img src={fileUrl(p.imageUrl)} alt={p.title} className="h-[130px] w-full object-cover" />
                      ) : (
                        <div className={`flex h-[130px] w-full items-center justify-center ${PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]}`}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#0F172A] opacity-90">
                            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePortfolioItem(p)}
                        aria-label={`Remove ${p.title}`}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#64748B] opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="flex flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">{p.title}</h3>
                          {p.link && (
                            <a href={p.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title}`} className="text-[#8C9BA8] hover:text-[#C06B3E]">
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <p className="mt-0.5 font-manrope text-[12px] text-[#8C9BA8]">
                          {[p.category, p.year].filter(Boolean).join(' · ') || 'Project'}
                        </p>
                        {p.description && <p className="mt-1.5 line-clamp-2 text-[12px] text-[#64748B]">{p.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 4 COLUMNS */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            {/* Profile Completion */}
            <div className="flex flex-col rounded-[22px] border border-[#F2ECE6] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-manrope text-[15px] font-bold text-[#08182B]">Profile Completion</span>
                <span className="font-manrope text-[15px] font-bold text-[#08182B]">{completion}%</span>
              </div>
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-[#E5E9EE]">
                <div className="h-full rounded-full bg-[#C06B3E] transition-all" style={{ width: `${completion}%` }} />
              </div>

              {profile.profileMissing && profile.profileMissing.length > 0 ? (
                <>
                  <p className="mt-3 font-manrope text-[12px] text-[#8C9BA8]">Still missing:</p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-[12px] text-[#475569]">
                    {profile.profileMissing.slice(0, 5).map((m) => (
                      <li key={m} className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C06B3E]" /> {m}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/freelancer/settings"
                    className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#C06B3E] font-manrope text-[13px] font-bold text-white no-underline shadow-xs transition-all hover:bg-[#A95A30]"
                  >
                    Complete Profile
                  </Link>
                </>
              ) : (
                <p className="mt-3 font-manrope text-[12px] font-semibold text-[#16A34A]">Your profile is complete. Great job!</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col rounded-[22px] border border-[#F2ECE6] bg-white p-5 sm:p-6">
              <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">Stats</h2>
              <div className="mt-4 flex flex-col space-y-3.5 font-manrope text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Projects Completed</span>
                  <span className="font-bold text-[#08182B]">{profile.completedProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Success Rate</span>
                  <span className="font-bold text-[#08182B]">{profile.completedProjects ? `${Math.round(profile.projectSuccessRate)}%` : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Total Earned</span>
                  <span className="font-bold text-[#08182B]">{formatINR(profile.revenueGenerated)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#64748B]">Leaderboard Score</span>
                  <span className="font-bold text-[#08182B]">{Math.round(profile.leaderboardScore)}</span>
                </div>
                {profile.memberSince && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Member Since</span>
                    <span className="font-bold text-[#08182B]">{formatDate(profile.memberSince, true)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-col rounded-[22px] border border-[#F2ECE6] bg-white p-5 sm:p-6">
              <h2 className="font-manrope text-[16px] font-bold text-[#08182B]">Skills</h2>

              {isEditing && draft ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {draft.skills.map((skill) => (
                      <span key={skill} className="flex items-center gap-1 rounded-[12px] border border-[#C06B3E]/40 bg-[#FBF4EE] px-3 py-1.5 text-[12px] font-medium text-[#9C5128]">
                        {skill}
                        <button type="button" aria-label={`Remove ${skill}`} onClick={() => setDraft({ ...draft, skills: draft.skills.filter((s) => s !== skill) })}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      maxLength={50}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="Add a skill and press Enter"
                      aria-label="New skill"
                      className={inputClass}
                    />
                    <button type="button" onClick={addSkill} className="rounded-[10px] bg-[#08182B] px-3 text-[12px] font-bold text-white">
                      Add
                    </button>
                  </div>
                </>
              ) : profile.skills.length === 0 ? (
                <p className="mt-3 text-[12.5px] italic text-[#A0AEC0]">
                  No skills added.{' '}
                  <button type="button" onClick={startEditing} className="font-bold not-italic text-[#C06B3E] hover:underline">
                    Add skills
                  </button>
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="rounded-[12px] border border-[#E2E8F0] bg-white px-3.5 py-1.5 font-manrope text-[12px] font-medium text-[#475569]">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add portfolio project */}
      {portfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Add portfolio project">
          <form onSubmit={savePortfolioItem} className="w-full max-w-[480px] rounded-[22px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-manrope text-[17px] font-bold text-[#08182B]">Add a project</h3>
              <button type="button" onClick={() => setPortfolioModal(false)} aria-label="Close" className="text-[#64748B] hover:text-[#08182B]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <input ref={itemImageRef} type="file" accept="image/*" className="hidden" onChange={uploadItemImage} />
              <button
                type="button"
                onClick={() => itemImageRef.current?.click()}
                className="flex h-[130px] w-full items-center justify-center overflow-hidden rounded-[14px] border-2 border-dashed border-[#E2E8F0] text-[#8C9BA8] hover:border-[#C06B3E] hover:text-[#C06B3E]"
              >
                {item.imageUrl ? (
                  <img src={fileUrl(item.imageUrl)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-[12px] font-semibold">
                    <ImagePlus size={22} />
                    {itemImageUploading ? 'Uploading…' : 'Add a cover image (optional)'}
                  </span>
                )}
              </button>
              <input className={inputClass + ' h-10'} placeholder="Project title *" maxLength={150} value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass + ' h-10'} placeholder="Category (e.g. Branding)" maxLength={80} value={item.category || ''} onChange={(e) => setItem({ ...item, category: e.target.value })} />
                <input
                  className={inputClass + ' h-10'}
                  type="number"
                  min={1990}
                  max={2100}
                  placeholder="Year"
                  value={item.year ?? ''}
                  onChange={(e) => setItem({ ...item, year: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <input className={inputClass + ' h-10'} type="url" placeholder="Link (Behance, Dribbble, live site…)" value={item.link || ''} onChange={(e) => setItem({ ...item, link: e.target.value })} />
              <textarea
                className={inputClass + ' h-20 py-2'}
                placeholder="Short description (optional)"
                maxLength={2000}
                value={item.description || ''}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
              />
              {itemError && <p className="text-[12px] font-semibold text-red-600">{itemError}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPortfolioModal(false)} className="rounded-full border border-[#CBD5E1] px-5 py-2 text-[13px] font-bold text-[#08182B]">
                Cancel
              </button>
              <button type="submit" disabled={savingItem || itemImageUploading} className="rounded-full bg-[#C06B3E] px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
                {savingItem ? 'Adding…' : 'Add project'}
              </button>
            </div>
          </form>
        </div>
      )}

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
