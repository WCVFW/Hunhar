import React, { useEffect, useMemo, useState } from 'react'
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

interface CategoryRule {
  name: string
  keywords: string[]
  suggestedSkills: string[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    name: 'UI/UX',
    keywords: [
      'ui/ux', 'uiux', 'ui designer', 'ux designer', 'ui/ux designer', 'ui', 'ux',
      'product designer', 'product design', 'designer', 'design', 'figma', 'figma designer',
      'wireframe', 'wireframing', 'prototype', 'prototyping', 'user interface', 'user experience',
      'mobile app design', 'app design', 'app designer', 'dashboard design', 'dashboard',
      'landing page design', 'redesign', 'usability', 'design system', 'xd', 'sketch', 'mobile ui'
    ],
    suggestedSkills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Mobile App Design', 'Design Systems']
  },
  {
    name: 'Web Design',
    keywords: [
      'web designer', 'website designer', 'web design', 'website design', 'web', 'website',
      'landing page', 'homepage', 'responsive design', 'wordpress', 'webflow', 'wix',
      'shopify', 'elementor', 'squarespace', 'frontend design', 'html', 'css', 'tailwind'
    ],
    suggestedSkills: ['Web Design', 'WordPress', 'HTML/CSS', 'Responsive Design', 'Webflow', 'Tailwind CSS']
  },
  {
    name: 'Branding',
    keywords: [
      'graphic designer', 'graphic design', 'graphics', 'brand designer', 'brand design',
      'branding', 'brand', 'logo', 'logo design', 'logo designer', 'identity', 'stationery',
      'packaging', 'packaging design', 'business card', 'letterhead', 'rebrand', 'rebranding',
      'visual identity', 'brand guideline', 'label', 'typography', 'brochure', 'catalog', 'flyer', 'poster', 'banner'
    ],
    suggestedSkills: ['Logo Design', 'Adobe Illustrator', 'Brand Identity', 'Photoshop', 'Packaging Design']
  },
  {
    name: 'Development',
    keywords: [
      'developer', 'development', 'develop', 'programmer', 'programming', 'software',
      'software engineer', 'coder', 'coding', 'code', 'backend', 'frontend', 'fullstack',
      'full stack', 'full-stack', 'api', 'database', 'react', 'next.js', 'nextjs', 'node',
      'nodejs', 'express', 'python', 'django', 'flask', 'java', 'spring', 'springboot',
      'spring boot', 'php', 'laravel', 'flutter', 'react native', 'swift', 'kotlin',
      'sql', 'postgres', 'mongodb', 'aws', 'docker', 'bug fix', 'devops', 'ai', 'ml',
      'machine learning', 'chatgpt', 'automation', 'bot', 'script', 'scraping', 'saas'
    ],
    suggestedSkills: ['React.js', 'Node.js', 'Full Stack Development', 'Python', 'API Integration', 'Database Design']
  },
  {
    name: 'Motion Design',
    keywords: [
      'motion designer', 'motion design', 'motion graphics', 'animator', 'animation',
      '2d animation', '3d animation', 'after effects', 'video editor', 'video editing',
      'video edit', 'video', 'reel', 'reels', 'shorts', 'tiktok', 'youtube video',
      'premiere', 'premiere pro', 'davinci', 'vfx', 'cgi', 'explainer video', 'blender'
    ],
    suggestedSkills: ['After Effects', 'Video Editing', 'Premiere Pro', '2D Animation', 'Motion Graphics', 'Blender']
  },
  {
    name: 'Illustration',
    keywords: [
      'illustrator', 'illustration', 'illustrate', 'digital artist', 'drawing', 'sketch',
      'digital art', 'character designer', 'character design', 'mascot', 'vector art',
      'cartoon', 'comic', 'doodle', 'children book', 'concept art', 'anime', 'portrait art'
    ],
    suggestedSkills: ['Digital Illustration', 'Adobe Illustrator', 'Character Design', 'Procreate', 'Vector Art']
  },
  {
    name: 'Marketing',
    keywords: [
      'marketer', 'marketing', 'market', 'digital marketing', 'social media marketing',
      'social media manager', 'smm', 'growth marketer', 'growth', 'seo', 'sem', 'google ads',
      'facebook ads', 'meta ads', 'ad campaign', 'ppc', 'email marketing', 'newsletter',
      'lead generation', 'leads', 'influencer', 'sales funnel'
    ],
    suggestedSkills: ['Digital Marketing', 'Social Media Marketing', 'SEO', 'Meta Ads', 'Google Ads', 'Content Strategy']
  },
  {
    name: 'Copywriting',
    keywords: [
      'copywriter', 'copywriting', 'copy', 'content writer', 'content writing', 'content',
      'writer', 'writing', 'blog writer', 'blog', 'article writer', 'article', 'ghostwriter',
      'technical writing', 'documentation', 'scriptwriter', 'scriptwriting', 'ad copy',
      'website copy', 'proofreading', 'proofread', 'resume', 'cv', 'translator', 'translation'
    ],
    suggestedSkills: ['Copywriting', 'Content Writing', 'Blog Writing', 'SEO Copywriting', 'Proofreading', 'Creative Writing']
  },
  {
    name: 'Photography',
    keywords: [
      'photographer', 'photography', 'photo', 'photoshoot', 'camera', 'product photography',
      'product photo', 'portrait photography', 'model shoot', 'fashion photography',
      'food photography', 'photo retouching', 'photo editing', 'lightroom', 'headshot'
    ],
    suggestedSkills: ['Product Photography', 'Adobe Lightroom', 'Photo Editing', 'Studio Lighting', 'Commercial Photography']
  },
]

function scoreKeywordMatch(text: string, kw: string): number {
  if (!text || !kw) return 0
  const t = text.toLowerCase().trim()
  const k = kw.toLowerCase().trim()

  // 1. Exact full text match (e.g. title is exactly "designer" or "developer")
  if (t === k) return 40

  // 2. Multi-word phrase match (e.g. keyword "ui designer" or "web design" in title)
  if (k.includes(' ')) {
    if (t.includes(k)) return 25
    return 0
  }

  // 3. Whole-word match using regex boundary
  const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const wordRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i')
  if (wordRegex.test(t)) {
    return 15
  }

  // 4. Substring / root word match for keywords >= 4 characters
  if (k.length >= 4 && t.includes(k)) {
    return 6
  }

  return 0
}

export default function CreateProjectPage(): React.JSX.Element {
  const navigate = useNavigate()

  // Form states
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState(false)
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

  // Dynamic category matching based on project title and description
  const { matchedCategory, rankedCategories, suggestedSkills } = useMemo(() => {
    const titleLower = projectTitle.trim().toLowerCase()
    const descLower = projectDescription.trim().toLowerCase()

    if (!titleLower && !descLower) {
      return {
        matchedCategory: null,
        rankedCategories: categories.map((cat) => ({ name: cat, score: 0, isMatch: false })),
        suggestedSkills: [] as string[]
      }
    }

    const scored = CATEGORY_RULES.map((rule) => {
      let score = 0
      for (const kw of rule.keywords) {
        // Keyword match in title is prioritized (3x)
        const titleScore = scoreKeywordMatch(titleLower, kw)
        if (titleScore > 0) {
          score += titleScore * 3
        } else if (descLower) {
          const descScore = scoreKeywordMatch(descLower, kw)
          score += descScore
        }
      }
      return {
        name: rule.name,
        score,
        isMatch: score > 0,
        suggestedSkills: rule.suggestedSkills
      }
    })

    // Sort categories: matched categories first by score descending, then default order
    const sorted = [...scored].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return categories.indexOf(a.name) - categories.indexOf(b.name)
    })

    const top = sorted[0].score > 0 ? sorted[0].name : null
    const activeCategory = selectedCategories[0] || top
    const activeRule = CATEGORY_RULES.find((r) => r.name === activeCategory)

    return {
      matchedCategory: top,
      rankedCategories: sorted,
      suggestedSkills: activeRule ? activeRule.suggestedSkills : []
    }
  }, [projectTitle, projectDescription, selectedCategories])

  // Automatically select the best matching category if user hasn't chosen one manually
  useEffect(() => {
    if (editId) return
    if (!userManuallySelectedCategory) {
      if (matchedCategory) {
        setSelectedCategories([matchedCategory])
      } else if (!projectTitle.trim() && !projectDescription.trim()) {
        setSelectedCategories([])
      }
    }
  }, [matchedCategory, userManuallySelectedCategory, editId, projectTitle, projectDescription])

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
        setUserManuallySelectedCategory(true)
        setSkillsRequired(splitList(p.skills).join(', '))
        setExistingAttachments(splitList(p.attachmentUrls))
      })
      .catch((err) => setErrorMessage(err.message))
  }, [editId])

  const toggleCategory = (cat: string) => {
    // User explicitly chose a category
    setUserManuallySelectedCategory(true)
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
                onChange={(e) => {
                  setProjectTitle(e.target.value)
                  setUserManuallySelectedCategory(false)
                }}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                  Category <span className="text-[#E11D48]">*</span>
                </label>
                {matchedCategory && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EE] px-2.5 py-0.5 font-manrope text-[11.5px] font-semibold text-[#C06B3E] transition-all">
                    <Sparkles size={12} className="animate-pulse text-[#C06B3E]" />
                    <span>Auto-matched: <strong className="font-bold">{matchedCategory}</strong></span>
                  </span>
                )}
              </div>
              <p className="mt-1 font-manrope text-[11.5px] text-[#64748B]">
                Categories dynamically rank and update based on your project title.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                {rankedCategories.map(({ name: cat, isMatch }) => {
                  const isSelected = selectedCategories.includes(cat)
                  const isTopMatched = matchedCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`relative inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 font-manrope text-[12.5px] font-medium transition-all ${
                        isSelected
                          ? 'border border-[#C06B3E] bg-[#C06B3E] text-white shadow-xs'
                          : isMatch
                          ? 'border border-[#DECFBE] bg-[#FAF8F5] text-[#C06B3E] hover:border-[#C06B3E]'
                          : 'border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1] hover:text-[#08182B]'
                      }`}
                    >
                      {isTopMatched && !isSelected && <Sparkles size={11} className="text-[#C06B3E]" />}
                      <span>{cat}</span>
                      {isMatch && !isSelected && (
                        <span className="rounded-full bg-[#EFE5DB] px-1.5 py-0.5 text-[9.5px] font-bold text-[#C06B3E]">
                          Suggested
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Field 5: Skills Required */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block font-manrope text-[13px] font-bold text-[#08182B]">
                  Skills Required
                </label>
                {suggestedSkills.length > 0 && (
                  <span className="font-manrope text-[11px] text-[#94A3B8]">
                    Click suggested skills to add
                  </span>
                )}
              </div>
              <input
                type="text"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                placeholder="e.g. Figma, Brand Identity, Illustration (comma-separated)"
                className="mt-2 h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-4 font-manrope text-[13.5px] text-[#08182B] placeholder-[#94A3B8] outline-none transition-all focus:border-[#C06B3E] focus:ring-2 focus:ring-[#C06B3E]/15"
              />
              {suggestedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="font-manrope text-[11px] font-semibold text-[#64748B]">
                    Suggested:
                  </span>
                  {suggestedSkills.map((skill) => {
                    const currentSkills = skillsRequired
                      .split(',')
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean)
                    const isAdded = currentSkills.includes(skill.toLowerCase())
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (isAdded) return
                          setSkillsRequired((prev) => {
                            const trimmed = prev.trim()
                            if (!trimmed) return skill
                            return `${trimmed}, ${skill}`
                          })
                        }}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-manrope text-[11px] transition-all ${
                          isAdded
                            ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-default'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#08182B] cursor-pointer'
                        }`}
                      >
                        <span>{skill}</span>
                        {isAdded ? <Check size={10} /> : <span className="text-[#C06B3E] font-bold">+</span>}
                      </button>
                    )
                  })}
                </div>
              )}
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
