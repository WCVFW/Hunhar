/**
 * Hunhar (hunhar.in) - Centralized API Client Service
 * Connects frontend to Spring Cloud Gateway on hunhar.in / http://localhost:8080
 */

import { secureFetch } from './secureTransport'

// Production builds talk to the EC2 backend at api.hunhar.in unless VITE_API_BASE_URL says otherwise
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://api.hunhar.in' : 'http://localhost:8080')

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp?: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Token management in secure localStorage
// "Remember me" keeps the session in localStorage; otherwise it lives in sessionStorage and ends with the tab.
const sessionStore = (): Storage => (localStorage.getItem('hunhar_token') || !sessionStorage.getItem('hunhar_token') ? localStorage : sessionStorage)

export const tokenStorage = {
  getToken: (): string | null => localStorage.getItem('hunhar_token') || sessionStorage.getItem('hunhar_token'),
  setToken: (token: string, remember = true): void => {
    localStorage.removeItem('hunhar_token')
    sessionStorage.removeItem('hunhar_token')
    ;(remember ? localStorage : sessionStorage).setItem('hunhar_token', token)
  },
  removeToken: (): void => {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem('hunhar_token')
      store.removeItem('hunhar_user')
    }
  },
  getUser: (): any => {
    const u = localStorage.getItem('hunhar_user') || sessionStorage.getItem('hunhar_user')
    return u ? JSON.parse(u) : null
  },
  setUser: (user: any): void => sessionStore().setItem('hunhar_user', JSON.stringify(user)),
  isAuthenticated: (): boolean => !!tokenStorage.getToken(),
}

export type UserRole = 'FREELANCER' | 'CLIENT' | 'ADMIN'

const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  FREELANCER: '/freelancer/dashboard',
  CLIENT: '/client/dashboard',
  ADMIN: '/admin/dashboard',
}

export const dashboardPathFor = (role: UserRole): string => DASHBOARD_BY_ROLE[role]

/**
 * Role of the logged-in user, read from the JWT (signed by the backend) rather than
 * the editable stored user object. Returns null when there is no valid, unexpired token.
 */
export const getSessionRole = (): UserRole | null => {
  const token = tokenStorage.getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      tokenStorage.removeToken()
      return null
    }
    const role = String(payload.role || '').toUpperCase()
    return role in DASHBOARD_BY_ROLE ? (role as UserRole) : null
  } catch {
    tokenStorage.removeToken()
    return null
  }
}

export const logout = (): void => {
  tokenStorage.removeToken()
  window.location.href = '/login'
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hunhar:loading-start'))
  }

  let res: Response
  try {
    // Every JSON API call is end-to-end encrypted (see secureTransport.ts / gateway PayloadEncryptionFilter)
    res = await secureFetch(API_BASE_URL, url, { ...options, headers })
  } catch (e: any) {
    if (e instanceof Error && e.message.startsWith('A secure (HTTPS)')) throw e
    throw new Error('Cannot reach the server. Please check your internet connection and try again.')
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hunhar:loading-end'))
    }
  }

  // Expired / invalid session: clear it and send the user to login (but not for a failed login attempt)
  if (res.status === 401 && token && !endpoint.startsWith('/api/v1/auth/')) {
    tokenStorage.removeToken()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = `/login?expired=1`
    }
  }

  let data: ApiResponse<T> | null = null
  try {
    data = await res.json()
  } catch {
    // non-JSON error page (proxy / gateway error)
  }

  if (!res.ok || !data || data.success === false) {
    const fallback =
      res.status === 403 ? 'You do not have permission to do this.'
        : res.status === 404 ? 'Not found.'
        : res.status >= 500 ? 'Something went wrong on our side. Please try again shortly.'
        : `Request failed (${res.status})`
    const err = new Error(data?.message || fallback) as Error & { status?: number; details?: unknown }
    err.status = res.status
    err.details = data?.data
    if (import.meta.env.DEV) console.warn(`API ${res.status} [${endpoint}]:`, err.message)
    throw err
  }
  return data.data
}

/** Turns a server file path (/api/v1/projects/files/...) into a full URL for <img>/<a>. */
export const fileUrl = (path?: string | null): string => {
  if (!path) return ''
  return path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:') ? path : `${API_BASE_URL}${path}`
}

// =============================================================================
// 1. Authentication & KYC
// =============================================================================
export interface AuthResult {
  token?: string
  refreshToken?: string
  userId?: string
  email: string
  fullName: string
  role?: 'FREELANCER' | 'CLIENT' | 'ADMIN'
  status?: string
  kycStatus?: string
  avatarUrl?: string
  needsRole?: boolean
}

/** Stores the session from a login/register/Google response and returns the dashboard path for the role. */
export const startSession = (res: AuthResult, remember = true): string => {
  tokenStorage.setToken(res.token!, remember)
  tokenStorage.setUser({ id: res.userId, userId: res.userId, fullName: res.fullName, email: res.email, role: res.role, avatarUrl: res.avatarUrl, kycStatus: res.kycStatus })
  return DASHBOARD_BY_ROLE[res.role || 'FREELANCER']
}

export const authApi = {
  registerFreelancer: (data: {
    fullName: string
    email: string
    mobile: string
    password: string
    skills?: string[]
    portfolioLinks?: string[]
  }) => apiRequest<any>('/api/v1/auth/register/freelancer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  registerClient: (data: {
    companyName: string
    contactPerson: string
    email: string
    mobile: string
    password: string
  }) => apiRequest<any>('/api/v1/auth/register/client', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  sendSignupOtp: (email: string) =>
    apiRequest<any>('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifySignupOtp: (email: string, otp: string) =>
    apiRequest<any>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  login: (data: { email: string; password: string }) =>
    apiRequest<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => apiRequest<any>('/api/v1/auth/me'),

  sendMobileOtp: (mobile: string) =>
    apiRequest<void>('/api/v1/auth/mobile-otp/send', { method: 'POST', body: JSON.stringify({ mobile }) }),

  verifyMobileOtp: (mobile: string, otp: string) =>
    apiRequest<void>('/api/v1/auth/mobile-otp/verify', { method: 'POST', body: JSON.stringify({ mobile, otp }) }),

  googleConfig: () => apiRequest<{ enabled: boolean; clientId: string | null }>('/api/v1/auth/google/config'),

  /** Sign in / sign up with Google. A new email returns { needsRole: true } until a role is sent. */
  google: (data: { accessToken: string; role?: 'FREELANCER' | 'CLIENT'; companyName?: string }) =>
    apiRequest<AuthResult>('/api/v1/auth/google', { method: 'POST', body: JSON.stringify(data) }),

  forgotPassword: (email: string) =>
    apiRequest<void>('/api/v1/auth/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    apiRequest<void>('/api/v1/auth/password/reset', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),


  submitAadhaarKyc: (aadhaarNumber: string) =>
    apiRequest<any>('/api/v1/kyc/aadhaar', {
      method: 'POST',
      body: JSON.stringify({ aadhaarNumber }),
    }),
}

// =============================================================================
// Shared response types (mirror the backend JSON)
// =============================================================================
export type ProjectStatus = 'DRAFT' | 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type BidStatus = 'SUBMITTED' | 'SHORTLISTED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN'
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'PAID'

export interface Project {
  id: string
  clientId: string
  awardedFreelancerId?: string | null
  title: string
  description: string
  category: string
  budget: number
  timelineDays: number
  skills: string
  status: ProjectStatus
  progressPercentage: number
  bidCount: number
  attachmentUrls?: string
  startDate?: string | null
  endDate?: string | null
  deadline?: string | null
  createdAt: string
  updatedAt: string
  clientName?: string
  clientAvatarUrl?: string
  freelancerName?: string
  myBidStatus?: BidStatus | null
  myRole?: 'OWNER' | 'COLLABORATOR' | null
}

export interface Bid {
  id: string
  projectId: string
  freelancerId: string
  proposedCost: number
  deliveryTimelineDays: number
  proposalMessage: string
  status: BidStatus
  shortlisted: boolean
  attachmentUrls?: string | null
  createdAt: string
  updatedAt: string
  projectTitle?: string
  projectCategory?: string
  projectStatus?: ProjectStatus
  projectBudget?: number
  clientId?: string
  clientName?: string
  freelancerName?: string
  freelancerAvatarUrl?: string
}

export interface StoredFile {
  id: string
  ownerId: string
  projectId?: string | null
  originalName: string
  contentType: string
  sizeBytes: number
  url: string
  ownerName?: string
  createdAt: string
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  amount: number
  dueDate?: string | null
  status: MilestoneStatus
  funded: boolean
  fundedAt?: string | null
  paidAt?: string | null
  submittedAt?: string | null
  invoiceNumber?: string | null
  createdAt: string
}

export interface Deliverable {
  id: string
  milestoneId: string
  projectId: string
  freelancerId: string
  notes: string
  fileUrls: string
  approved: boolean
  createdAt: string
}

export interface TeamMember {
  id: string
  projectId: string
  primaryFreelancerId: string
  collaboratorFreelancerId: string
  role: string
  status: 'INVITED' | 'ACCEPTED' | 'DECLINED'
  message?: string
  createdAt: string
  projectTitle?: string
  primaryFreelancerName?: string
  collaboratorName?: string
  collaboratorAvatarUrl?: string
}

export interface Workspace {
  project: Project
  myRole: 'CLIENT' | 'OWNER' | 'COLLABORATOR' | 'ADMIN'
  agreedAmount: number
  agreedTimelineDays: number
  milestones: { milestone: Milestone; deliverables: Deliverable[] }[]
  files: StoredFile[]
  team: TeamMember[]
}

export interface PortfolioItem {
  id?: string
  title: string
  category?: string
  year?: number
  description?: string
  link?: string
  imageUrl?: string
}

export interface FreelancerProfile {
  id: string
  fullName: string
  avatarUrl?: string
  coverUrl?: string
  kycStatus: 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'
  emailVerified: boolean
  memberSince?: string
  professionalTitle?: string
  bio?: string
  skills: string[]
  location?: string
  availability?: string
  hourlyRate?: number
  experienceYears?: number
  collegeUniversity?: string
  graduationYear?: number
  degreeField?: string
  portfolioUrl?: string
  githubUrl?: string
  completedProjects: number
  rating: number
  revenueGenerated: number
  responseRate: number
  projectSuccessRate: number
  leaderboardScore: number
  rank?: number
  portfolio: PortfolioItem[]
  profileCompletion?: number
  profileMissing?: string[]
  email?: string
  mobile?: string
  payout?: {
    method?: 'UPI' | 'BANK' | null
    upiId?: string
    accountHolder?: string
    bankName?: string
    accountNumberMasked?: string
    ifscCode?: string
    panMasked?: string
    autoWithdrawal: boolean
  }
  notificationPrefs?: Record<string, boolean>
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  fullName: string
  professionalTitle?: string
  completedProjects: number
  rating: number
  revenueGenerated: number
  responseRate: number
  projectSuccessRate: number
  leaderboardScore: number
  avatarUrl?: string
  skills: string[]
  location?: string
}

export interface CalendarTask {
  id: string
  title: string
  notes?: string
  type: 'TASK' | 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'REVIEW'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  dueAt?: string | null
  allDay: boolean
  projectId?: string | null
  projectTitle?: string | null
  reminderMinutes?: number | null
  completedAt?: string | null
  createdAt: string
}

export type CalendarTaskInput = Omit<CalendarTask, 'id' | 'createdAt' | 'completedAt' | 'status'> & {
  status?: CalendarTask['status']
}

export interface Conversation {
  id: string
  projectId?: string | null
  participant1Id: string
  participant2Id: string
  lastMessage?: string
  lastMessageAt?: string
  otherPartyId: string
  otherPartyName?: string
  otherPartyAvatarUrl?: string
  otherPartyRole?: string
  unreadCount: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName?: string
  content: string
  attachmentUrl?: string | null
  createdAt: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link?: string | null
  createdAt: string
}

export interface PaymentOrder {
  id: string
  gatewayOrderId: string
  keyId: string
  amount: number
  amountPaise: number
  currency: string
  description: string
  mock: boolean
  mockSignature?: string
}

const qs = (params: Record<string, string | number | boolean | undefined | null | string[]>): string => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) {
      if (v.length) q.append(k, v.join(','))
    } else {
      q.append(k, String(v))
    }
  })
  const s = q.toString()
  return s ? '?' + s : ''
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

// =============================================================================
// 2. Projects & Discovery
// =============================================================================
export interface ProjectSearchParams {
  categories?: string[]
  excludeCategories?: string[]
  search?: string
  minBudget?: number
  maxBudget?: number
  maxDays?: number
  sort?: 'newest' | 'budget_desc' | 'budget_asc' | 'deadline_asc'
  page?: number
  size?: number
}

export const projectsApi = {
  getProjects: (params: ProjectSearchParams = {}) =>
    apiRequest<PagedResponse<Project>>('/api/v1/projects' + qs({ ...params })),

  getProjectById: (id: string) => apiRequest<Project>(`/api/v1/projects/${id}`),

  createProject: (data: {
    title: string
    description: string
    category: string
    budget: number
    timelineDays: number
    skills?: string[]
    attachmentUrls?: string[]
  }) => apiRequest<Project>('/api/v1/projects', json('POST', data)),

  getClientProjects: () => apiRequest<Project[]>('/api/v1/projects/client/my-projects'),

  getFreelancerProjects: () => apiRequest<Project[]>('/api/v1/projects/freelancer/my-projects'),

  completeProject: (id: string) => apiRequest<Project>(`/api/v1/projects/${id}/complete`, json('POST')),
}

export const filesApi = {
  upload: (file: File, projectId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (projectId) form.append('projectId', projectId)
    return apiRequest<StoredFile>('/api/v1/projects/files', { method: 'POST', body: form })
  },
}

// =============================================================================
// 3. Bids System
// =============================================================================
export const bidsApi = {
  submitBid: (projectId: string, data: { proposedCost: number; deliveryTimelineDays: number; proposalMessage: string; attachmentUrls?: string[] }) =>
    apiRequest<Bid>(`/api/v1/bids/project/${projectId}`, json('POST', data)),

  getProjectBids: (projectId: string) => apiRequest<Bid[]>(`/api/v1/bids/project/${projectId}`),

  getMyBids: () => apiRequest<Bid[]>('/api/v1/bids/my-bids'),

  withdrawBid: (bidId: string) => apiRequest<Bid>(`/api/v1/bids/${bidId}/withdraw`, json('PATCH')),

  awardBid: (bidId: string) => apiRequest<Project>(`/api/v1/bids/${bidId}/award`, json('POST')),
}

// =============================================================================
// 4. Workspace & Team
// =============================================================================
export const workspaceApi = {
  get: (projectId: string) => apiRequest<Workspace>(`/api/v1/workspace/projects/${projectId}`),

  addMilestone: (projectId: string, data: { title: string; description?: string; amount: number; dueDate?: string }) =>
    apiRequest<Milestone>(`/api/v1/workspace/projects/${projectId}/milestones`, json('POST', data)),

  submitDeliverable: (milestoneId: string, data: { notes: string; fileUrls: string[] }) =>
    apiRequest<Deliverable>(`/api/v1/workspace/milestones/${milestoneId}/deliverables`, json('POST', data)),

  updateProgress: (projectId: string, progressPercentage: number) =>
    apiRequest<Project>(`/api/v1/workspace/projects/${projectId}/progress` + qs({ progressPercentage }), json('PATCH')),
}

export const teamApi = {
  invite: (projectId: string, data: { collaboratorFreelancerId: string; role: string; message?: string }) =>
    apiRequest<TeamMember>(`/api/v1/collaborations/project/${projectId}/invite`, json('POST', data)),

  myInvites: () => apiRequest<TeamMember[]>('/api/v1/collaborations/my-invites'),

  sentInvites: () => apiRequest<TeamMember[]>('/api/v1/collaborations/sent'),

  respond: (inviteId: string, accept: boolean) =>
    apiRequest<TeamMember>(`/api/v1/collaborations/invites/${inviteId}/respond` + qs({ accept }), json('POST')),

  remove: (inviteId: string) => apiRequest<void>(`/api/v1/collaborations/invites/${inviteId}`, json('DELETE')),
}

// =============================================================================
// 5. Freelancer profile, settings & directory
// =============================================================================
export const profileApi = {
  getMine: () => apiRequest<FreelancerProfile>('/api/v1/users/me/profile'),

  update: (data: Partial<Omit<FreelancerProfile, 'portfolio' | 'payout' | 'notificationPrefs'>>) =>
    apiRequest<FreelancerProfile>('/api/v1/users/me/profile', json('PUT', data)),

  updatePayout: (data: {
    method: 'UPI' | 'BANK'
    upiId?: string
    accountHolder?: string
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    panNumber?: string
    autoWithdrawal: boolean
  }) => apiRequest<FreelancerProfile>('/api/v1/users/me/payout', json('PUT', data)),

  updateNotificationPrefs: (prefs: Record<string, boolean>) =>
    apiRequest<Record<string, boolean>>('/api/v1/users/me/notification-prefs', json('PUT', prefs)),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<void>('/api/v1/users/me/password', json('POST', { currentPassword, newPassword })),

  addPortfolioItem: (item: PortfolioItem) => apiRequest<PortfolioItem>('/api/v1/users/me/portfolio', json('POST', item)),

  updatePortfolioItem: (id: string, item: PortfolioItem) =>
    apiRequest<PortfolioItem>(`/api/v1/users/me/portfolio/${id}`, json('PUT', item)),

  deletePortfolioItem: (id: string) => apiRequest<void>(`/api/v1/users/me/portfolio/${id}`, json('DELETE')),

  getPublic: (userId: string) => apiRequest<FreelancerProfile>(`/api/v1/users/${userId}/profile`),

  searchFreelancers: (params: { search?: string; skill?: string; limit?: number } = {}) =>
    apiRequest<FreelancerProfile[]>('/api/v1/users/freelancers' + qs(params)),
}

// =============================================================================
// 6. Wallet, Payments & Credits
// =============================================================================
export const paymentsApi = {
  createOrder: (data: { purpose: 'CREDIT_PACKAGE' | 'WALLET_TOPUP'; packageId?: string; amount?: number }) =>
    apiRequest<PaymentOrder>('/api/v1/payments/orders', json('POST', data)),

  verify: (orderId: string, paymentId: string, signature: string) =>
    apiRequest<any>(`/api/v1/payments/orders/${orderId}/verify`, json('POST', { paymentId, signature })),

  /** RAZORPAY = real checkout (live=true means real money); SIMULATOR = no Razorpay keys on the server yet. */
  gatewayInfo: () => apiRequest<{ provider: 'RAZORPAY' | 'SIMULATOR'; live: boolean }>('/api/v1/payments/gateway'),
}

export const walletApi = {
  getMyWallet: () => apiRequest<any>('/api/v1/wallets/my-wallet'),

  getTransactions: () => apiRequest<any[]>('/api/v1/wallets/transactions'),

  requestPayout: (data: { amount: number; payoutMethod: 'UPI' | 'BANK_TRANSFER'; accountDetails: string }) =>
    apiRequest<any>('/api/v1/wallets/payout' + qs({ amount: data.amount, payoutMethod: data.payoutMethod, accountDetails: data.accountDetails }), json('POST')),

  getPayouts: () => apiRequest<any[]>('/api/v1/wallets/payouts'),
}

export const creditsApi = {
  getMyCredits: () => apiRequest<{ userId: string; balance: number; totalPurchased: number; totalConsumed: number }>('/api/v1/credits/my-credits'),

  getPackages: () => apiRequest<{ id: string; name: string; credits: number; priceInInr: number; active: boolean }[]>('/api/v1/credits/packages'),

  getHistory: () => apiRequest<{ id: string; delta: number; reason: string; balanceAfter?: number; projectId?: string; createdAt: string }[]>('/api/v1/credits/history'),

  /** Pays for a credit pack from the wallet balance (no checkout window). */
  buyWithWallet: (packageId: string) =>
    apiRequest<{ credits: number; walletBalance: number; transactionId: string }>('/api/v1/credits/buy-with-wallet', json('POST', { packageId })),
}

// =============================================================================
// 7. Leaderboard
// =============================================================================
export const leaderboardApi = {
  getLeaderboard: (limit: number = 10, search?: string) =>
    apiRequest<LeaderboardEntry[]>('/api/v1/leaderboard' + qs({ limit, search })),

  getMyStanding: () => apiRequest<LeaderboardEntry>('/api/v1/leaderboard/me'),
}

// =============================================================================
// 8. Messages
// =============================================================================
export const messagesApi = {
  getConversations: () => apiRequest<Conversation[]>('/api/v1/messages/conversations'),

  startConversation: (recipientId: string, projectId?: string) =>
    apiRequest<Conversation>('/api/v1/messages/conversations' + qs({ recipientId, projectId }), json('POST')),

  getMessages: (conversationId: string) => apiRequest<ChatMessage[]>(`/api/v1/messages/conversations/${conversationId}`),

  sendMessage: (conversationId: string, content: string, attachmentUrl?: string) =>
    apiRequest<ChatMessage>(`/api/v1/messages/conversations/${conversationId}`, json('POST', { content, attachmentUrl })),

  getUnreadCount: () => apiRequest<number>('/api/v1/messages/unread-count'),
}

// =============================================================================
// 9. Notifications
// =============================================================================
export const notificationsApi = {
  getNotifications: (limit = 100) => apiRequest<AppNotification[]>('/api/v1/notifications' + qs({ limit })),

  getUnreadCount: () => apiRequest<number>('/api/v1/notifications/unread-count'),

  markAsRead: (id: string) => apiRequest<void>(`/api/v1/notifications/${id}/read`, json('PATCH')),

  markAllAsRead: () => apiRequest<number>('/api/v1/notifications/read-all', json('PATCH')),

  remove: (id: string) => apiRequest<void>(`/api/v1/notifications/${id}`, json('DELETE')),

  clearAll: () => apiRequest<void>('/api/v1/notifications', json('DELETE')),
}

// =============================================================================
// 10. Calendar & to-dos
// =============================================================================
export const calendarApi = {
  getTasks: (from: Date, to: Date, includeUndated = false) =>
    apiRequest<CalendarTask[]>('/api/v1/calendar/tasks' + qs({ from: from.toISOString(), to: to.toISOString(), includeUndated })),

  getTodos: () => apiRequest<CalendarTask[]>('/api/v1/calendar/todos'),

  getSummary: () => apiRequest<{ todo: number; inProgress: number; done: number; overdue: number }>('/api/v1/calendar/summary'),

  createTask: (task: CalendarTaskInput) => apiRequest<CalendarTask>('/api/v1/calendar/tasks', json('POST', task)),

  updateTask: (id: string, task: CalendarTaskInput) => apiRequest<CalendarTask>(`/api/v1/calendar/tasks/${id}`, json('PUT', task)),

  setStatus: (id: string, status: CalendarTask['status']) =>
    apiRequest<CalendarTask>(`/api/v1/calendar/tasks/${id}/status` + qs({ status }), json('PATCH')),

  deleteTask: (id: string) => apiRequest<void>(`/api/v1/calendar/tasks/${id}`, json('DELETE')),
}

// =============================================================================
// 11. Client: company profile, project management, invoices
// =============================================================================
export interface ClientProfile {
  id: string
  fullName: string
  email: string
  mobile?: string
  avatarUrl?: string
  kycStatus: FreelancerProfile['kycStatus']
  emailVerified: boolean
  memberSince?: string
  companyName: string
  industry?: string
  companySize?: string
  location?: string
  website?: string
  companyDescription?: string
  gstin?: string
  billingAddress?: string
  notificationPrefs: Record<string, boolean>
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  freelancerId: string
  projectId?: string
  milestoneId?: string
  description: string
  grossAmount: number
  commissionAmount: number
  gstAmount: number
  netPayoutToFreelancer: number
  createdAt: string
}

export interface ProjectInput {
  title: string
  description: string
  category: string
  budget: number
  timelineDays: number
  skills?: string[]
  attachmentUrls?: string[]
  publish?: boolean
}

export const clientApi = {
  getProfile: () => apiRequest<ClientProfile>('/api/v1/users/me/client-profile'),

  updateProfile: (data: Partial<Omit<ClientProfile, 'id' | 'email' | 'kycStatus' | 'emailVerified' | 'memberSince'>>) =>
    apiRequest<ClientProfile>('/api/v1/users/me/client-profile', json('PUT', data)),

  createProject: (data: ProjectInput) => apiRequest<Project>('/api/v1/projects', json('POST', data)),

  updateProject: (id: string, data: ProjectInput) => apiRequest<Project>(`/api/v1/projects/${id}`, json('PUT', data)),

  publishProject: (id: string) => apiRequest<Project>(`/api/v1/projects/${id}/publish`, json('POST')),

  cancelProject: (id: string) => apiRequest<Project>(`/api/v1/projects/${id}/cancel`, json('POST')),

  recentBids: () => apiRequest<Bid[]>('/api/v1/bids/client/recent'),

  shortlistBid: (bidId: string, shortlist: boolean) =>
    apiRequest<Bid>(`/api/v1/bids/${bidId}/shortlist` + qs({ shortlist }), json('PATCH')),

  rejectBid: (bidId: string) => apiRequest<Bid>(`/api/v1/bids/${bidId}/reject`, json('PATCH')),

  fundMilestone: (milestoneId: string) => apiRequest<Milestone>(`/api/v1/workspace/milestones/${milestoneId}/fund`, json('POST')),

  releaseMilestone: (milestoneId: string) => apiRequest<Milestone>(`/api/v1/workspace/milestones/${milestoneId}/release`, json('POST')),

  reviewDeliverable: (deliverableId: string, approve: boolean) =>
    apiRequest<void>(`/api/v1/workspace/deliverables/${deliverableId}/review` + qs({ approve }), json('POST')),

  invoices: () => apiRequest<Invoice[]>('/api/v1/invoices/client/my-invoices'),
}

export const invoicesApi = {
  freelancerInvoices: () => apiRequest<Invoice[]>('/api/v1/invoices/freelancer/my-invoices'),

  /** Downloads the PDF with the auth header (a plain link would not send the token). */
  download: async (invoiceNumber: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/v1/invoices/${encodeURIComponent(invoiceNumber)}/pdf`, {
      headers: { Authorization: `Bearer ${tokenStorage.getToken() || ''}` },
    })
    if (!res.ok) throw new Error(res.status === 403 ? 'You cannot download this invoice' : 'Could not download the invoice')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoiceNumber}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}

// =============================================================================
// 12. Disputes & KYC (all roles)
// =============================================================================
export interface Dispute {
  id: string
  projectId: string
  raisedById: string
  reason: string
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED'
  resolutionNotes?: string
  resolvedAt?: string
  createdAt: string
  projectTitle?: string
  projectBudget?: number
  raisedByName?: string
  raisedByRole?: string
  clientId?: string
  clientName?: string
  freelancerId?: string
  freelancerName?: string
}

export interface KycInfo {
  kycStatus: FreelancerProfile['kycStatus']
  aadhaarLast4?: string
  documentUrl?: string
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export const disputesApi = {
  raise: (projectId: string, reason: string) => apiRequest<Dispute>(`/api/v1/disputes/project/${projectId}`, json('POST', { reason })),

  forProject: (projectId: string) => apiRequest<Dispute[]>(`/api/v1/disputes/project/${projectId}`),
}

export const kycApi = {
  me: () => apiRequest<KycInfo>('/api/v1/kyc/me'),

  submit: (aadhaarNumber: string, documentUrl: string) =>
    apiRequest<KycInfo>('/api/v1/kyc/aadhaar', json('POST', { aadhaarNumber, documentUrl })),
}

// =============================================================================
// 13. Platform settings (admin-controlled, readable by everyone signed in)
// =============================================================================
export interface PlatformSettings {
  commissionPercent: string
  creditsPerBid: string
  starterCredits: string
  minPayout: string
  kycRequiredForPayout: string
  autoApproveDays: string
}

export const settingsApi = {
  get: () => apiRequest<PlatformSettings>('/api/v1/payments/settings'),
}

// =============================================================================
// 14. Admin
// =============================================================================
export interface AdminUser {
  id: string
  email: string
  fullName: string
  mobile?: string
  role: UserRole
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  kycStatus: FreelancerProfile['kycStatus']
  emailVerified: boolean
  avatarUrl?: string
  createdAt: string
}

export interface KycApplication extends KycInfo {
  userId: string
  fullName: string
  email: string
  mobile?: string
  role: UserRole
  avatarUrl?: string
  memberSince?: string
}

export interface AdminTransaction {
  id: string
  userId: string
  userName?: string
  userRole?: string
  type: string
  status: string
  amount: number
  description?: string
  projectId?: string
  gatewayRefId?: string
  createdAt: string
}

export interface AdminPayout {
  id: string
  freelancerId: string
  freelancerName?: string
  amount: number
  payoutMethod: 'UPI' | 'BANK_TRANSFER'
  accountDetails: string
  status: 'REQUESTED' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export interface CreditPackageAdmin {
  id: string
  name: string
  credits: number
  priceInInr: number
  active: boolean
}

export type MonthlyPoint = { month: string } & Record<string, number | string>

export interface PlatformAnalytics {
  users: {
    totalUsers?: number
    freelancers?: number
    clients?: number
    activeUsers?: number
    suspendedUsers?: number
    pendingKyc?: number
    verifiedKyc?: number
    newThisMonth?: number
    monthly?: MonthlyPoint[]
  }
  projects: {
    totalProjects?: number
    draftProjects?: number
    openProjects?: number
    activeProjects?: number
    completedProjects?: number
    cancelledProjects?: number
    openDisputes?: number
    monthly?: MonthlyPoint[]
  }
  payments: {
    gmv?: number
    commissionEarned?: number
    escrowHeld?: number
    walletTopups?: number
    creditSales?: number
    pendingPayoutsCount?: number
    pendingPayoutsAmount?: number
    monthly?: MonthlyPoint[]
  }
  engagement: { conversations: number; messages: number }
  unavailable: string[]
  generatedAt: string
}

export const adminApi = {
  analytics: () => apiRequest<PlatformAnalytics>('/api/v1/analytics/summary'),

  users: (params: { role?: UserRole; status?: AdminUser['status']; search?: string; limit?: number } = {}) =>
    apiRequest<AdminUser[]>('/api/v1/users' + qs(params)),

  setUserStatus: (userId: string, status: AdminUser['status'], reason?: string) =>
    apiRequest<void>(`/api/v1/users/${userId}/status` + qs({ status, reason }), json('PATCH')),

  kycList: (status?: FreelancerProfile['kycStatus']) => apiRequest<KycApplication[]>('/api/v1/kyc/admin' + qs({ status })),

  reviewKyc: (userId: string, approved: boolean, reason?: string) =>
    apiRequest<void>(`/api/v1/kyc/${userId}/approve` + qs({ approved, reason }), json('POST')),

  projects: (params: { status?: ProjectStatus; search?: string } = {}) =>
    apiRequest<Project[]>('/api/v1/projects/admin/all' + qs(params)),

  cancelProject: (projectId: string, reason: string) =>
    apiRequest<Project>(`/api/v1/projects/admin/${projectId}/cancel` + qs({ reason }), json('POST')),

  disputes: (status?: Dispute['status']) => apiRequest<Dispute[]>('/api/v1/disputes' + qs({ status })),

  resolveDispute: (disputeId: string, status: 'RESOLVED' | 'DISMISSED', resolutionNotes: string) =>
    apiRequest<Dispute>(`/api/v1/disputes/${disputeId}/resolve`, json('POST', { status, resolutionNotes })),

  transactions: (type?: string) => apiRequest<AdminTransaction[]>('/api/v1/payments/admin/transactions' + qs({ type })),

  payouts: (status?: AdminPayout['status']) => apiRequest<AdminPayout[]>('/api/v1/wallets/admin/payouts' + qs({ status })),

  processPayout: (payoutId: string, approve: boolean, notes: string) =>
    apiRequest<void>(`/api/v1/wallets/payouts/${payoutId}/process` + qs({ approve, notes }), json('POST')),

  getSettings: () => apiRequest<PlatformSettings>('/api/v1/payments/settings'),

  updateSettings: (changes: Partial<Record<keyof PlatformSettings, string | number | boolean>>) =>
    apiRequest<PlatformSettings>('/api/v1/payments/settings', json('PUT', changes)),

  packages: () => apiRequest<CreditPackageAdmin[]>('/api/v1/credits/admin/packages'),

  savePackage: (pkg: Omit<CreditPackageAdmin, 'id'> & { id?: string }) =>
    pkg.id
      ? apiRequest<CreditPackageAdmin>(`/api/v1/credits/admin/packages/${pkg.id}`, json('PUT', pkg))
      : apiRequest<CreditPackageAdmin>('/api/v1/credits/admin/packages', json('POST', pkg)),
}
