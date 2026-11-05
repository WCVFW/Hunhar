import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Download, BadgeCheck } from 'lucide-react'
import { adminApi, fileUrl, type AdminUser, type UserRole } from '../../services/api'
import { formatDate, initials } from '../../services/format'
import { useAdminData, LoadingBlock, ErrorBanner, EmptyBlock, downloadCsv, ROLE_LABEL, roleBadge } from './adminUi'

const STATUS_LABEL: Record<AdminUser['status'], string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  PENDING_VERIFICATION: 'Pending Verification',
  REJECTED: 'Rejected',
}

const KYC_LABEL: Record<string, string> = {
  NOT_SUBMITTED: 'KYC not submitted',
  PENDING_REVIEW: 'KYC pending',
  VERIFIED: 'KYC verified',
  REJECTED: 'KYC rejected',
}

type RoleTab = 'All' | 'FREELANCER' | 'CLIENT'

export default function AdminUsersPage(): React.JSX.Element {
  const [selectedRole, setSelectedRole] = useState<RoleTab>('All')
  const [params] = useSearchParams()
  const [searchInput, setSearchInput] = useState(params.get('q') || '')
  const [search, setSearch] = useState(params.get('q') || '')

  // A new search from the top bar while this page is open
  useEffect(() => {
    const q = params.get('q')
    if (q != null) setSearchInput(q)
  }, [params])
  const [actionError, setActionError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  // Search on the server, 350 ms after the admin stops typing
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const { data: users, setData: setUsers, loading, error, reload } = useAdminData(
    () => adminApi.users({ role: selectedRole === 'All' ? undefined : (selectedRole as UserRole), search: search || undefined, limit: 500 }),
    [selectedRole, search],
  )
  const { data: analytics } = useAdminData(() => adminApi.analytics())
  const counts = analytics?.users

  const toggleUserStatus = async (user: AdminUser) => {
    const next: AdminUser['status'] = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    let reason: string | undefined
    if (next === 'SUSPENDED') {
      const r = window.prompt(`Reason for suspending ${user.fullName}? (shown in the audit log)`)
      if (r === null) return
      reason = r.trim() || undefined
    }
    setBusyId(user.id)
    setActionError('')
    try {
      await adminApi.setUserStatus(user.id, next, reason)
      setUsers((prev) => (prev || []).map((u) => (u.id === user.id ? { ...u, status: next } : u)))
    } catch (err: any) {
      setActionError(err.message || 'Could not update the account')
    } finally {
      setBusyId(null)
    }
  }

  const exportCsv = () => {
    downloadCsv(
      `hunhar-users-${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Name', 'Email', 'Mobile', 'Role', 'Status', 'KYC', 'Email verified', 'Joined'],
      (users || []).map((u) => [u.id, u.fullName, u.email, u.mobile, ROLE_LABEL[u.role] || u.role, STATUS_LABEL[u.status], u.kycStatus, u.emailVerified ? 'Yes' : 'No', u.createdAt]),
    )
  }

  const tabLabel = (tab: RoleTab) => {
    if (tab === 'All') return `All Users${counts?.totalUsers != null ? ` (${counts.totalUsers})` : ''}`
    if (tab === 'FREELANCER') return `Freelancers${counts?.freelancers != null ? ` (${counts.freelancers})` : ''}`
    return `Clients${counts?.clients != null ? ` (${counts.clients})` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">User Management</h1>
          <p className="text-sm text-[#8E8376]">
            Inspect registered freelancers, hiring clients, KYC statuses, and account controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={!users?.length}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5DACD] bg-white px-3.5 py-2 text-xs font-semibold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
        <div className="flex w-full md:w-auto items-center gap-1 rounded-xl bg-[#F8F4EE] p-1 border border-[#E5DACD]/60 text-xs font-semibold">
          {(['All', 'FREELANCER', 'CLIENT'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedRole(tab)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg transition-all ${
                selectedRole === tab ? 'bg-white text-[#C06B3E] shadow-xs font-bold' : 'text-[#8E8376] hover:text-[#08182B]'
              }`}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or mobile..."
            className="w-full rounded-xl border border-[#E5DACD] bg-white pl-9 pr-4 py-1.5 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
          />
        </div>
      </div>

      <ErrorBanner message={error} onRetry={reload} />
      <ErrorBanner message={actionError} />

      {loading && !users ? (
        <LoadingBlock label="Loading users…" />
      ) : !users?.length ? (
        <EmptyBlock title="No users found" hint={search ? 'Try a different search.' : 'New sign-ups will appear here.'} />
      ) : (
        <div className="rounded-[20px] bg-white border border-[#E5DACD] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-manrope text-xs">
              <thead>
                <tr className="border-b border-[#F0EAE1] bg-[#FAFAF8] text-[#8E8376]">
                  <th className="py-3 px-4 font-semibold">User Details</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">KYC</th>
                  <th className="py-3 px-4 font-semibold">Mobile</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1]">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F9F6F0] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={fileUrl(user.avatarUrl)} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#08182B] to-[#1B254B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {initials(user.fullName)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#08182B]">{user.fullName}</span>
                            {user.emailVerified && <BadgeCheck size={13} className="text-emerald-600" aria-label="Email verified" />}
                          </div>
                          <div className="text-[11px] text-[#8E8376]">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${roleBadge(user.role)}`}>
                        {ROLE_LABEL[user.role] || user.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : user.status === 'SUSPENDED' || user.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : user.status === 'PENDING_VERIFICATION' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        {STATUS_LABEL[user.status] || user.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#524B42]">
                      {user.role === 'FREELANCER' ? KYC_LABEL[user.kycStatus] || user.kycStatus : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-[#524B42]">{user.mobile || '—'}</td>

                    <td className="py-3.5 px-4 text-[#8E8376]">{formatDate(user.createdAt, true)}</td>

                    <td className="py-3.5 px-4 text-right">
                      {user.role !== 'ADMIN' && (
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          onClick={() => toggleUserStatus(user)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                            user.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {busyId === user.id ? 'Saving…' : user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
