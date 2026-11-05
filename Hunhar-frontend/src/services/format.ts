/**
 * Formatting helpers shared by the dashboard pages, so money, dates and statuses read the same everywhere.
 */
import type { BidStatus, Project } from './api'

export const formatINR = (value?: number | string | null, opts: { decimals?: boolean } = {}): string => {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '₹0'
  return '₹' + n.toLocaleString('en-IN', {
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : 0,
  })
}

export const formatDate = (iso?: string | null, withYear = false): string => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

export const formatTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''

export const timeAgo = (iso?: string | null): string => {
  if (!iso) return ''
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 45) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso, new Date(iso).getFullYear() !== new Date().getFullYear())
}

/** "5 days left", "Due today", "2 days overdue" — or the timeline for projects that have not started. */
export const deadlineLabel = (p: Pick<Project, 'deadline' | 'timelineDays' | 'status'>): string => {
  if (p.status === 'COMPLETED') return 'Completed'
  if (!p.deadline) return p.timelineDays ? `${p.timelineDays} day timeline` : 'Flexible'
  const days = Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86_400_000)
  if (days > 1) return `${days} days left`
  if (days === 1) return '1 day left'
  if (days === 0) return 'Due today'
  return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`
}

export const isOverdue = (p: Pick<Project, 'deadline' | 'status'>): boolean =>
  !!p.deadline && p.status === 'ACTIVE' && new Date(p.deadline).getTime() < Date.now()

export const splitList = (value?: string | string[] | null): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export const initials = (name?: string | null): string =>
  (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const fileExtension = (name: string): string => {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? 'FILE' : name.slice(dot + 1).toUpperCase().slice(0, 4)
}

export const BID_STATUS_LABEL: Record<BidStatus, string> = {
  SUBMITTED: 'Pending',
  SHORTLISTED: 'Shortlisted',
  AWARDED: 'Accepted',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
}

export const BID_STATUS_STYLE: Record<BidStatus, string> = {
  SUBMITTED: 'bg-[#FEF3C7] text-[#B45309]',
  SHORTLISTED: 'bg-[#EDE9FE] text-[#6D28D9]',
  AWARDED: 'bg-[#DCFCE7] text-[#15803D]',
  REJECTED: 'bg-[#FEE2E2] text-[#B91C1C]',
  WITHDRAWN: 'bg-[#F1F5F9] text-[#64748B]',
}

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  OPEN: 'Accepting bids',
  ACTIVE: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/**
 * Freelancer browse tabs mapped to the categories clients choose when posting a project
 * (see CreateProjectPage). "others" means anything outside the known list.
 */
export const KNOWN_CLIENT_CATEGORIES = [
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

export const CATEGORY_GROUPS: Record<string, string[]> = {
  web: ['Web Design', 'Development', 'UI/UX'],
  design: ['Branding', 'UI/UX', 'Illustration', 'Photography'],
  writing: ['Copywriting'],
  marketing: ['Marketing'],
  video: ['Motion Design'],
}

