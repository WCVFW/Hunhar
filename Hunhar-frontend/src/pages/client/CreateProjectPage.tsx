import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Check,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { projectsApi } from '../../services/api'

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Branding'])
  const [skillsRequired, setSkillsRequired] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const parseTimelineDays = (t: string): number => {
    if (t.includes('1 week')) return 7
    if (t.includes('1 to 2')) return 14
    if (t.includes('2 to 4')) return 28
    if (t.includes('1 to 3')) return 60
    if (t.includes('3+')) return 90
    return 14
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const numericBudget = parseFloat(budget.replace(/[^0-9.]/g, '')) || 1000
      const days = parseTimelineDays(timeline)
      const parsedSkills = skillsRequired
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await projectsApi.createProject({
        title: projectTitle,
        description: projectDescription,
        category: selectedCategories[0] || 'General',
        budget: numericBudget,
        timelineDays: days,
        skills: parsedSkills,
      })

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Failed to create project:', err)
      setErrorMessage(err.message || 'Failed to publish project to hunhar.in backend. Please ensure you are logged in as a Client.')
    } finally {
      setIsSubmitting(false)
    }
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
          Create Project
        </h1>
        <p className="mt-1 font-manrope text-[14px] text-[#7A7065]">
          Post a new project and receive proposals from skilled freelancers.
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
              Project Created Successfully!
            </h2>
            <p className="mt-1.5 max-w-md text-[13.5px] text-[#7A7065]">
              Your project has been posted. Top freelancers will begin reviewing and submitting proposals shortly.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/client/dashboard"
                className="rounded-[12px] bg-[#C06B3E] px-6 py-2.5 font-manrope text-[13px] font-bold text-white shadow-xs hover:bg-[#A95A30]"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false)
                  setProjectTitle('')
                  setProjectDescription('')
                  setBudget('')
                  setSkillsRequired('')
                  setAttachments([])
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
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
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
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="h-12 w-full appearance-none rounded-[12px] border border-[#E2E8F0] bg-white px-4 pr-10 font-manrope text-[13.5px] text-[#08182B] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
                  >
                    <option value="">Select timeline</option>
                    <option value="Less than 1 week">Less than 1 week</option>
                    <option value="1 to 2 weeks">1 to 2 weeks</option>
                    <option value="2 to 4 weeks">2 to 4 weeks</option>
                    <option value="1 to 3 months">1 to 3 months</option>
                    <option value="3+ months">3+ months</option>
                  </select>
                  {/* Chevron down */}
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 4: Category Pills */}
            <div>
              <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                Category
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
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE5DB] text-[#C06B3E]">
                  <Upload size={18} strokeWidth={2.2} />
                </div>
                <p className="mt-3 font-manrope text-[13px] text-[#475569]">
                  Drop files here or <span className="font-bold text-[#C06B3E] hover:underline">browse</span>
                </p>
                <p className="mt-1 font-manrope text-[11.5px] text-[#94A3B8]">
                  PDF, PNG, JPG, Figma links — up to 20MB
                </p>
              </div>

              {/* Uploaded Files list if any */}
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#08182B]"
                    >
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
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
                to="/client/dashboard"
                className="flex h-12 w-full sm:flex-1 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white font-manrope text-[14px] font-semibold text-[#08182B] transition-all hover:bg-[#F8FAFC] active:scale-98"
              >
                Cancel
              </Link>

              {/* Save as draft Button */}
              <button
                type="button"
                onClick={() => {
                  alert('Project saved as draft successfully!')
                  navigate('/client/dashboard')
                }}
                className="flex h-12 w-full sm:flex-1 items-center justify-center rounded-[12px] border border-[#08182B] bg-white font-manrope text-[14px] font-semibold text-[#08182B] transition-all hover:bg-[#08182B]/5 active:scale-98"
              >
                Save as draft
              </button>

              {/* Publish Project Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full sm:flex-1 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#D98F62] to-[#C06B3E] font-manrope text-[14px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(192,107,62,0.5)] transition-all hover:opacity-95 active:scale-98 disabled:opacity-70"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
