import React, { useState } from 'react'
import {
  Search,
  Download,
} from 'lucide-react'


interface UserItem {
  id: string
  name: string
  email: string
  role: 'Freelancer' | 'Client' | 'Enterprise'
  status: 'Active' | 'Suspended' | 'Pending Verification'
  projectsCount: number
  spentOrEarned: string
  joinedDate: string
  badge?: string
}

const mockUsers: UserItem[] = [
  {
    id: 'USR-1001',
    name: 'Aarav Patel',
    email: 'aarav.design@gmail.com',
    role: 'Freelancer',
    status: 'Active',
    projectsCount: 14,
    spentOrEarned: '₹ 2,40,000 earned',
    joinedDate: 'Jan 12, 2026',
    badge: 'Top Rated',
  },
  {
    id: 'USR-1002',
    name: 'TechNova Solutions (Rakesh)',
    email: 'rakesh@technova.io',
    role: 'Client',
    status: 'Active',
    projectsCount: 8,
    spentOrEarned: '₹ 5,80,000 spent',
    joinedDate: 'Feb 04, 2026',
    badge: 'Verified Buyer',
  },
  {
    id: 'USR-1003',
    name: 'Meera Nambiar',
    email: 'meera.dev@outlook.com',
    role: 'Freelancer',
    status: 'Pending Verification',
    projectsCount: 1,
    spentOrEarned: '₹ 15,000 earned',
    joinedDate: 'Mar 18, 2026',
  },
  {
    id: 'USR-1004',
    name: 'Spammy Bot / Crypto Lead',
    email: 'cryptoleads99@tempmail.com',
    role: 'Client',
    status: 'Suspended',
    projectsCount: 0,
    spentOrEarned: '₹ 0',
    joinedDate: 'Apr 02, 2026',
  },
  {
    id: 'USR-1005',
    name: 'Zomax Brand Agency',
    email: 'admin@zomax.agency',
    role: 'Client',
    status: 'Active',
    projectsCount: 19,
    spentOrEarned: '₹ 12,20,000 spent',
    joinedDate: 'Nov 15, 2025',
    badge: 'Enterprise',
  },
  {
    id: 'USR-1006',
    name: 'Karthik Raja',
    email: 'karthik.flutter@gmail.com',
    role: 'Freelancer',
    status: 'Active',
    projectsCount: 22,
    spentOrEarned: '₹ 4,10,000 earned',
    joinedDate: 'Dec 01, 2025',
    badge: 'Top Rated',
  },
]

export default function AdminUsersPage(): React.JSX.Element {
  const [selectedRole, setSelectedRole] = useState<'All' | 'Freelancer' | 'Client'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [usersList, setUsersList] = useState<UserItem[]>(mockUsers)

  const filteredUsers = usersList.filter((u) => {
    const matchesRole = selectedRole === 'All' || u.role === selectedRole
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  const toggleUserStatus = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active'
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
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
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5DACD] bg-white px-3.5 py-2 text-xs font-semibold text-[#08182B] shadow-xs hover:bg-[#F8F4EE] transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
        {/* Role Segmented control */}
        <div className="flex w-full md:w-auto items-center gap-1 rounded-xl bg-[#F8F4EE] p-1 border border-[#E5DACD]/60 text-xs font-semibold">
          {(['All', 'Freelancer', 'Client'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedRole(tab)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg transition-all ${
                selectedRole === tab
                  ? 'bg-white text-[#C06B3E] shadow-xs font-bold'
                  : 'text-[#8E8376] hover:text-[#08182B]'
              }`}
            >
              {tab === 'All' ? 'All Users (4.8k)' : tab === 'Freelancer' ? 'Freelancers (3.4k)' : 'Clients (1.4k)'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8376]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email or ID..."
            className="w-full rounded-xl border border-[#E5DACD] bg-white pl-9 pr-4 py-1.5 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-[20px] bg-white border border-[#E5DACD] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-manrope text-xs">
            <thead>
              <tr className="border-b border-[#F0EAE1] bg-[#FAFAF8] text-[#8E8376]">
                <th className="py-3 px-4 font-semibold">User Details</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Projects</th>
                <th className="py-3 px-4 font-semibold">Volume</th>
                <th className="py-3 px-4 font-semibold">Joined Date</th>
                <th className="py-3 px-4 font-semibold text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F9F6F0] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#08182B] to-[#1B254B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#08182B]">{user.name}</span>
                          {user.badge && (
                            <span className="rounded bg-[#C06B3E]/10 border border-[#C06B3E]/20 text-[#C06B3E] px-1.5 py-0.2 text-[9px] font-bold">
                              {user.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8E8376] flex items-center gap-2">
                          <span>{user.email}</span>
                          <span className="font-mono text-gray-400">({user.id})</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        user.role === 'Freelancer'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : user.role === 'Client'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : user.status === 'Suspended'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : user.status === 'Suspended' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      {user.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-[#08182B]">
                    {user.projectsCount} {user.projectsCount === 1 ? 'project' : 'projects'}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#524B42]">
                    {user.spentOrEarned}
                  </td>

                  <td className="py-3.5 px-4 text-[#8E8376]">
                    {user.joinedDate}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          user.status === 'Active'
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {user.status === 'Active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
