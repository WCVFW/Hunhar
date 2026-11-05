import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Check,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { clientApi, filesApi, projectsApi, type Project, type StoredFile } from '../../services/api'
import { splitList } from '../../services/format'
import { toRouteId, fromRouteId } from '../../services/routeIds'

const TIMELINE_OPTIONS: { label: string; days: number }[] = [
  { label: 'Less than 1 week', days: 7 },
  { label: '1 to 2 weeks', days: 14 },
  { label: '2 to 4 weeks', days: 28 },
  { label: '1 to 3 months', days: 60 },
  { label: '3+ months', days: 90 },
]

const categories = [
  'Branding',
  'Web Design',
  'UI/UX',
  'Motion Design',
  'Illustration',
  'Marketing',
  'Development',
  'Photography',
  'Copywriting',
]

export default function CreateProjectPage(): React.JSX.Element {
  const navigate = useNavigate()

  // Form states
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [customDays, setCustomDays] = useState('')
  const [skillsRequired, setSkillsRequired] = useState('')
  const [isSubmitting, setIsSubmitting] = useState<false | 'draft' | 'publish'>(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<StoredFile[]>([])
  const [existingAttachments, setExistingAttachments] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState<Project | null>(null)
  const [searchParams] = useSearchParams()
  const editId = fromRouteId(searchParams.get('edit')) || null

  // Edit mode: load the draft / unbid project
  useEffect(() => {
    if (!editId) return
    projectsApi
      .getProjectById(editId)
      .then((p) => {
        setProjectTitle(p.title)
        setProjectDescription(p.description)
        setBudget(String(Math.round(Number(p.budget))))
        setTimeline(TIMELINE_OPTIONS.find((o) => o.days === p.timelineDays)?.label || '')
        setCustomDays(TIMELINE_OPTIONS.some((o) => o.days === p.timelineDays) ? '' : String(p.timelineDays))
        setSelectedCategories(p.category ? [p.category] : [])
        setSkillsRequired(splitList(p.skills).join(', '))
        setExistingAttachments(splitList(p.attachmentUrls))
      })
      .catch((err) => setErrorMessage(err.message))
  }, [editId])

  const toggleCategory = (cat: string) => {
    // A project has one category; clicking another one switches to it
    setSelectedCategories((prev) => (prev.includes(cat) ? [] : [cat]))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    if (uploaded.length + existingAttachments.length + files.length > 10) {
      setErrorMessage('You can attach up to 10 files.')
      return
    }
    setUploading(true)
    setErrorMessage(null)
    try {
      for (const file of files) {
        const stored = await filesApi.upload(file)
        setUploaded((prev) => [...prev, stored])
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setUploaded((prev) => prev.filter((_, i) => i !== index))
  }

  const timelineDays = (): number | null => {
    if (customDays.trim()) {
      const n = Number(customDays)
      return Number.isInteger(n) && n >= 1 && n <= 365 ? n : null
    }
    return TIMELINE_OPTIONS.find((o) => o.label === timeline)?.days ?? null
  }

  const save = async (publish: boolean) => {
    setErrorMessage(null)
    const numericBudget = Number(budget.replace(/[^0-9.]/g, ''))
    const days = timelineDays()
    if (projectTitle.trim().length < 5) return setErrorMessage('Title must be at least 5 characters.')
    if (projectDescription.trim().length < 30) return setErrorMessage('Please describe the project in at least 30 characters.')
    if (!(numericBudget >= 100)) return setErrorMessage('Budget must be at least ₹100.')
    if (days === null) return setErrorMessage('Please choose a timeline (or enter 1–365 days).')
    if (!selectedCategories[0]) return setErrorMessage('Please choose a category.')

    setIsSubmitting(publish ? 'publish' : 'draft')
    try {
      const payload = {
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        category: selectedCategories[0],
        budget: numericBudget,
        timelineDays: days,
        skills: skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
        attachmentUrls: [...existingAttachments, ...uploaded.map((f) => f.url)],
        publish,
      }
      const project = editId ? await clientApi.updateProject(editId, payload) : await clientApi.createProject(payload)
      setSaved(project)
      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save the project. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    save(true)
  }

  return (
    <div className="w-full font-manrope">
      {/* 1. Back to Dashboard Button */}
      <div className="mb-4">
        <Link
          to="/client/dashboard"
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#64748B] transition-colors hover:text-[#08182B]"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* 2. Main Page Header */}
      <div className="mb-8">
        <h1 className="font-manrope text-[24px] sm:text-[28px] font-extrabold text-[#08182B]">
          {editId ? 'Edit Project' : 'Create Project'}
        </h1>
        <p className="mt-1 font-manrope text-[14px] text-[#7A7065]">
          {editId ? 'Update your project details. You can edit until freelancers start sending proposals.' : 'Post a new project and receive proposals from skilled freelancers.'}
        </p>
      </div>

      {/* 3. Form Card Container matching screenshot */}
      <div className="w-full rounded-[24px] border border-[#F0ECE6] bg-white p-6 sm:p-9 shadow-sm">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF7EE] text-[#16A34A] shadow-inner">
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 font-manrope text-[22px] font-bold text-[#08182B]">
              {saved?.status === 'DRAFT' ? 'Draft Saved' : editId ? 'Project Updated' : 'Project Published!'}
            </h2>
            <p className="mt-1.5 max-w-md text-[13.5px] text-[#7A7065]">
              {saved?.status === 'DRAFT'
                ? 'Your draft is saved. Freelancers will see it once you publish it.'
                : 'Freelancers can now see your project and send proposals. You will be notified for every proposal.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={saved ? `/client/projects/${toRouteId(saved.id)}` : '/client/projects'}
                className="rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13px] font-bold text-white no-underline shadow-xs hover:bg-[#A95A30]"
              >
                View Project
              </Link>
              <button
                type="button"
                onClick={() => {
                  navigate('/client/create-project')
                  setIsSuccess(false)
                  setSaved(null)
                  setProjectTitle('')
                  setProjectDescription('')
                  setBudget('')
                  setTimeline('')
                  setCustomDays('')
                  setSelectedCategories([])
                  setSkillsRequired('')
                  setUploaded([])
                  setExistingAttachments([])
                }}
                className="rounded-[12px] border border-[#CBD5E1] px-5 py-2.5 font-manrope text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Create Another Project
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-[12px] border border-red-200 bg-red-50 p-3.5 text-[13px] font-medium text-red-700">
                <AlertCircle size={18} className="shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field 1: Project Title */}
            <div>
              <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                Project Title <span className="text-[#E11D48]">*</span>
              </label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Brand Identity for a Tech Startup"
                className="mt-2 h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-4 font-manrope text-[13.5px] text-[#08182B] placeholder-[#94A3B8] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
              />
            </div>

            {/* Field 2: Project Description */}
            <div>
              <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                Project Description <span className="text-[#E11D48]">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project in detail — scope, deliverables, style preferences, and any references..."
                className="mt-2 w-full rounded-[14px] border border-[#E2E8F0] bg-white p-4 font-manrope text-[13.5px] leading-relaxed text-[#08182B] placeholder-[#94A3B8] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
              />
            </div>

            {/* Field 3: Budget (INR) & Timeline */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Budget */}
              <div>
                <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                  Budget (INR) <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="₹ e.g. 1500"
                    className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-4 font-manrope text-[13.5px] text-[#08182B] placeholder-[#94A3B8] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                  Timeline
                </label>
                <div className="relative mt-2">
                  <select
                    value={customDays ? 'custom' : timeline}
                    onChange={(e) => {
                      setTimeline(e.target.value === 'custom' ? '' : e.target.value)
                      setCustomDays(e.target.value === 'custom' ? '30' : '')
                    }}
                    className="h-12 w-full appearance-none rounded-[12px] border border-[#E2E8F0] bg-white px-4 pr-10 font-manrope text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
                  >
                    <option value="">Select timeline</option>
                    <option value="Less than 1 week">Less than 1 week</option>
                    <option value="1 to 2 weeks">1 to 2 weeks</option>
                    <option value="2 to 4 weeks">2 to 4 weeks</option>
                    <option value="1 to 3 months">1 to 3 months</option>
                    <option value="3+ months">3+ months</option>
                    <option value="custom">Exact number of days…</option>
                  </select>
                  {/* Chevron down */}
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {customDays !== '' && (
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    aria-label="Timeline in days"
                    placeholder="Days (1-365)"
                    className="mt-2 h-11 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-4 font-manrope text-[13.5px] text-[#08182B] outline-none focus:border-[#C06B3E]"
                  />
                )}
              </div>
            </div>

            {/* Field 4: Category Pills */}
            <div>
              <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                Category <span className="text-[#E11D48]">*</span>
              </label>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-full px-4 py-1.5 font-manrope text-[12.5px] font-medium transition-all ${
                        isSelected
                          ? 'border border-[#C06B3E] bg-[#C06B3E] text-white shadow-xs'
                          : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1] hover:text-[#08182B]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field 5: Skills Required */}
            <div>
              <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                Skills Required
              </label>
              <input
                type="text"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                placeholder="e.g. Figma, Brand Identity, Illustration (comma-separated)"
                className="mt-2 h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-4 font-manrope text-[13.5px] text-[#08182B] placeholder-[#94A3B8] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
              />
            </div>

            {/* Field 6: Attachments Upload Area */}
            <div>
              <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                Attachments
              </label>
              <div className="relative mt-2 flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#DECFBE] bg-[#FAF8F5]/60 p-7 text-center transition-colors hover:bg-[#FAF8F5]">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  aria-label="Upload attachments"
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE5DB] text-[#C06B3E]">
                  <Upload size={18} strokeWidth={2.2} />
                </div>
                <p className="mt-3 font-manrope text-[13px] text-[#475569]">
                  Drop files here or <span className="font-bold text-[#C06B3E] hover:underline">browse</span>
                </p>
                <p className="mt-1 font-manrope text-[11.5px] text-[#94A3B8]">
                  {uploading ? 'Uploading…' : 'PDF, images, docs, design files — up to 20MB each, 10 files'}
                </p>
              </div>

              {(uploaded.length > 0 || existingAttachments.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {existingAttachments.map((url, idx) => (
                    <div key={url} className="flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#08182B]">
                      <span className="truncate max-w-[200px]">Attachment {idx + 1}</span>
                      <button type="button" aria-label="Remove attachment" onClick={() => setExistingAttachments((prev) => prev.filter((u) => u !== url))} className="text-[#94A3B8] hover:text-[#EF4444]">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {uploaded.map((file, idx) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#08182B]"
                    >
                      <span className="truncate max-w-[200px]">{file.originalName}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        aria-label={`Remove ${file.originalName}`}
                        className="text-[#94A3B8] hover:text-[#EF4444]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons Row matching exact image */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-6 border-t border-[#F5F2ED]">
              {/* Cancel Button */}
              <Link
                to={editId ? `/client/projects/${toRouteId(editId)}` : '/client/dashboard'}
                className="flex h-12 w-full sm:flex-1 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white font-manrope text-[14px] font-semibold text-[#08182B] no-underline transition-all hover:bg-[#F8FAFC] active:scale-98"
              >
                Cancel
              </Link>

              {/* Save as draft Button */}
              <button
                type="button"
                onClick={() => save(false)}
                disabled={isSubmitting !== false || uploading}
                className="flex h-12 w-full sm:flex-1 items-center justify-center rounded-[12px] border border-[#08182B] bg-white font-manrope text-[14px] font-semibold text-[#08182B] transition-all hover:bg-[#08182B]/5 active:scale-98 disabled:opacity-60"
              >
                {isSubmitting === 'draft' ? 'Saving…' : 'Save as draft'}
              </button>

              {/* Publish Project Button */}
              <button
                type="submit"
                disabled={isSubmitting !== false || uploading}
                className="flex h-12 w-full sm:flex-1 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D98F62] to-[#C06B3E] font-manrope text-[14px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.5)] transition-all hover:opacity-95 active:scale-98 disabled:opacity-70"
              >
                {isSubmitting === 'publish' ? 'Publishing…' : 'Publish Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
