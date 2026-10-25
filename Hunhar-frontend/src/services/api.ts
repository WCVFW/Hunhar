/**
 * Hunhar (hunhar.in) - Centralized API Client Service
 * Connects frontend to Spring Cloud Gateway on hunhar.in / http://localhost:8080
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
export const tokenStorage = {
  getToken: (): string | null => localStorage.getItem('hunhar_token'),
  setToken: (token: string): void => localStorage.setItem('hunhar_token', token),
  removeToken: (): void => {
    localStorage.removeItem('hunhar_token')
    localStorage.removeItem('hunhar_user')
  },
  getUser: (): any => {
    const u = localStorage.getItem('hunhar_user')
    return u ? JSON.parse(u) : null
  },
  setUser: (user: any): void => localStorage.setItem('hunhar_user', JSON.stringify(user)),
  isAuthenticated: (): boolean => !!localStorage.getItem('hunhar_token'),
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

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  let res: Response
  try {
    res = await fetch(url, { ...options, headers })
  } catch {
    throw new Error('Cannot reach the server. Please check your internet connection and try again.')
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
