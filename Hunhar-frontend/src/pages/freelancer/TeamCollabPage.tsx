import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Star, X, ChevronDown, CheckCircle2, Send, MapPin, Clock, ExternalLink, Inbox, Users2 } from 'lucide-react'
import {
  fileUrl,
  messagesApi,
  profileApi,
  projectsApi,
  teamApi,
  type FreelancerProfile,
  type Project,
  type TeamMember,
} from '../../services/api'
import { formatDate, formatINR, initials, timeAgo } from '../../services/format'
import { toRouteId, fromRouteId } from '../../services/routeIds'

type Tab = 'find' | 'invites' | 'sent'
type ModalStep = 'invite-form' | 'invitation-sent' | 'view-profile'

const AVATAR_COLORS = ['bg-[#00966D]', 'bg-[#2563EB]', 'bg-[#EA580C]', 'bg-[#7C3AED]', 'bg-[#DB2777]']
const colorFor = (id: string) => AVATAR_COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
const PORTFOLIO_BG = ['from-[#EEF2FF] to-[#E0E7FF]', 'from-[#ECFDF5] to-[#D1FAE5]', 'from-[#FFFBEB] to-[#FEF3C7]', 'from-[#FFF1F2] to-[#FFE4E6]']

const STATUS_STYLE: Record<TeamMember['status'], string> = {
  INVITED: 'bg-[#FEF3C7] text-[#B45309]',
  ACCEPTED: 'bg-[#DCFCE7] text-[#15803D]',
  DECLINED: 'bg-[#FEE2E2] text-[#B91C1C]',
}

function Avatar({ p, size = 'h-12 w-12', text = 'text-[16px]' }: { p: { id: string; fullName: string; avatarUrl?: string }; size?: string; text?: string }) {
  if (p.avatarUrl) return <img src={fileUrl(p.avatarUrl)} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full font-manrope font-bold text-white shadow-xs ${text} ${colorFor(p.id)}`}>
      {initials(p.fullName)}
    </div>
  )
}

const ratingLabel = (p: FreelancerProfile) => (p.completedProjects > 0 && p.rating > 0 ? p.rating.toFixed(1) : null)

export default function TeamCollabPage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const preselectProject = fromRouteId(searchParams.get('project'))
  const [tab, setTab] = useState<Tab>('find')
  const [searchQuery, setSearchQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [invites, setInvites] = useState<TeamMember[]>([])
  const [sent, setSent] = useState<TeamMember[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const [selected, setSelected] = useState<FreelancerProfile | null>(null)
  const [fullProfile, setFullProfile] = useState<FreelancerProfile | null>(null)
  const [modalStep, setModalStep] = useState<ModalStep | null>(null)
  const [selectedProject, setSelectedProject] = useState(preselectProject)
  const [inviteRole, setInviteRole] = useState('')
  const [invitationMessage, setInvitationMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [modalError, setModalError] = useState('')
  const [lastInvite, setLastInvite] = useState<TeamMember | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQuery.trim()), 350)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    setLoading(true)
    profileApi
      .searchFreelancers({ search: debounced || undefined, limit: 40 })
      .then((list) => {
        setFreelancers(list)
        setError('')
      })
      .catch((err) => setError(err.message || 'Could not load freelancers'))
      .finally(() => setLoading(false))
  }, [debounced])

  const loadTeamData = () => {
    projectsApi.getFreelancerProjects().then(setMyProjects).catch(() => {})
    teamApi.myInvites().then(setInvites).catch(() => {})
    teamApi.sentInvites().then(setSent).catch(() => {})
  }

  useEffect(loadTeamData, [])

  // Projects I lead that are in progress: the only ones I can build a team on
  const invitableProjects = useMemo(() => myProjects.filter((p) => p.myRole === 'OWNER' && p.status === 'ACTIVE'), [myProjects])
  const pendingInvites = invites.filter((i) => i.status === 'INVITED')

  const handleOpenProfile = (f: FreelancerProfile) => {
    setSelected(f)
    setFullProfile(null)
    setModalStep('view-profile')
    profileApi.getPublic(f.id).then(setFullProfile).catch(() => setFullProfile(f))
  }

  const handleOpenInvite = (f: FreelancerProfile) => {
    setSelected(f)
    setModalError('')
    setSelectedProject((prev) => (invitableProjects.some((p) => p.id === prev) ? prev : invitableProjects[0]?.id || ''))
    setInviteRole(f.professionalTitle || f.skills[0] || '')
    setInvitationMessage(`Hi ${f.fullName.split(' ')[0]}, I'm working on a project that could be a great fit for your skills. Would you like to collaborate?`)
    setModalStep('invite-form')
  }

  const handleCloseModal = () => {
    setModalStep(null)
    setSelected(null)
  }

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!selectedProject) return setModalError('Choose one of your active projects.')
    if (!inviteRole.trim()) return setModalError('Enter the role they will take on.')
    setSending(true)
    setModalError('')
    try {
      const invite = await teamApi.invite(selectedProject, {
        collaboratorFreelancerId: selected.id,
        role: inviteRole.trim(),
        message: invitationMessage.trim() || undefined,
      })
      setLastInvite(invite)
      setSent((prev) => [invite, ...prev])
      setModalStep('invitation-sent')
    } catch (err: any) {
      setModalError(err.message || 'Could not send the invitation')
    } finally {
      setSending(false)
    }
  }

  const respond = async (invite: TeamMember, accept: boolean) => {
    setBusyId(invite.id)
    try {
      const updated = await teamApi.respond(invite.id, accept)
      setInvites((prev) => prev.map((i) => (i.id === invite.id ? updated : i)))
      if (accept) projectsApi.getFreelancerProjects().then(setMyProjects).catch(() => {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const cancelInvite = async (invite: TeamMember) => {
    if (!window.confirm(invite.status === 'ACCEPTED' ? `Remove ${invite.collaboratorName} from the team?` : 'Cancel this invitation?')) return
    setBusyId(invite.id)
    try {
      await teamApi.remove(invite.id)
      setSent((prev) => prev.filter((i) => i.id !== invite.id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const messageInviter = async (invite: TeamMember) => {
    try {
      const conv = await messagesApi.startConversation(invite.primaryFreelancerId, invite.projectId)
      window.location.href = `/freelancer/messages?c=${toRouteId(conv.id)}`
    } catch (err: any) {
      setError(err.message)
    }
  }

  const profileForModal = fullProfile || selected
  const projectTitle = (id: string) => invitableProjects.find((p) => p.id === id)?.title || ''

  return (
    <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-4 shadow-xs font-manrope sm:p-7 lg:p-8">
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="font-manrope text-[24px] font-bold text-[#C06B3E] sm:text-[26px]">Team Collaboration</h1>
          <p className="mt-0.5 font-manrope text-[14px] text-[#7A7065]">Find freelancers and invite them to help on projects you are leading.</p>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist">
          {(
            [
              ['find', 'Find freelancers'],
              ['invites', `Invitations${pendingInvites.length ? ` (${pendingInvites.length})` : ''}`],
              ['sent', `Sent${sent.length ? ` (${sent.length})` : ''}`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold transition-colors ${
                tab === key ? 'bg-[#08182B] text-white' : 'bg-[#F7F2EC] text-[#5C5248] hover:bg-[#EFE5DB]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>}

        {tab === 'find' && (
          <>
            {invitableProjects.length === 0 && (
              <div className="rounded-[14px] border border-[#F2C5A5] bg-[#FCECE0] p-3.5 text-[12.5px] font-semibold text-[#8C461F]">
                You can invite teammates once you are leading an active project. <Link to="/freelancer/browse" className="text-[#C06B3E]">Find projects</Link>
              </div>
            )}

            <div className="relative w-full max-w-[420px]">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9284]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, skill, or title..."
                aria-label="Search freelancers"
                className="w-full rounded-[14px] border border-[#E5DACD] bg-[#FCFBF8] py-2.5 pl-10 pr-4 font-manrope text-[13.5px] text-[#08182B] placeholder-[#9E9284] outline-none transition-all focus:border-[#C06B3E] focus:bg-white focus:ring-1 focus:ring-[#C06B3E]/30"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-[13px] text-[#8E8376]">Loading freelancers…</div>
            ) : freelancers.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-10 text-center text-[13px] text-[#8E8376]">
                {debounced ? 'No freelancers match your search.' : 'No other freelancers yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {freelancers.map((f) => {
                  const rating = ratingLabel(f)
                  return (
                    <div
                      key={f.id}
                      className="flex flex-col justify-between rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-[#C06B3E]/40 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3.5">
                            <Avatar p={f} />
                            <div className="min-w-0">
                              <h3 className="truncate font-manrope text-[16px] font-bold text-[#08182B]">{f.fullName}</h3>
                              <p className="truncate font-manrope text-[13px] text-[#7A7065]">{f.professionalTitle || 'Freelancer'}</p>
                              <div className="mt-1 flex items-center gap-1 font-manrope text-[12px] font-semibold text-[#08182B]">
                                <Star size={13} className={rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'} />
                                {rating ? (
                                  <>
                                    <span>{rating}</span>
                                    <span className="text-[#8E8376]">({f.completedProjects})</span>
                                  </>
                                ) : (
                                  <span className="font-normal text-[#8E8376]">New on Hunhar</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {f.availability && (
                            <span className="max-w-[110px] truncate rounded-full bg-[#E9F9EE] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#1F874C]" title={f.availability}>
                              {f.availability}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          {f.skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="rounded-[8px] bg-[#F4F4F5] px-2.5 py-1 font-manrope text-[11px] font-medium text-[#52525B]">
                              {skill}
                            </span>
                          ))}
                          {f.skills.length > 4 && (
                            <span className="rounded-[8px] bg-[#F4F4F5] px-2 py-1 font-manrope text-[11px] font-medium text-[#71717A]">+{f.skills.length - 4}</span>
                          )}
                          {f.skills.length === 0 && <span className="text-[11.5px] text-[#A1A1AA]">No skills listed</span>}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#F4F4F5] pt-3">
                          <span className="font-manrope text-[12px] font-medium text-[#8E8376]">
                            {f.experienceYears != null ? `${f.experienceYears}+ years` : f.location || `Joined ${formatDate(f.memberSince, true)}`}
                          </span>
                          <span className="font-manrope text-[15px] font-extrabold text-[#08182B]">
                            {f.hourlyRate != null ? `${formatINR(f.hourlyRate)}/hr` : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(f)}
                          className="rounded-[12px] border border-[#E5DACD] bg-white py-2.5 font-manrope text-[13px] font-bold text-[#08182B] transition-colors hover:bg-[#FAF7F2]"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenInvite(f)}
                          disabled={invitableProjects.length === 0}
                          title={invitableProjects.length === 0 ? 'You need an active project you lead' : undefined}
                          className="rounded-[12px] bg-[#1E293B] py-2.5 font-manrope text-[13px] font-bold text-white shadow-xs transition-all hover:bg-[#0F172A] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Invite
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'invites' && (
          <div className="flex flex-col gap-3">
            {invites.length === 0 ? (
              <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-10 text-center text-[13px] text-[#8E8376]">
                <Inbox size={26} className="mb-2 text-[#C5B8A8]" />
                No invitations yet. When another freelancer invites you to their project, it shows up here.
              </div>
            ) : (
              invites.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 rounded-[18px] border border-[#EBEBEB] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-bold text-[#08182B]">{inv.projectTitle || 'Project'}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[inv.status]}`}>
                        {inv.status === 'INVITED' ? 'Pending' : inv.status === 'ACCEPTED' ? 'Accepted' : 'Declined'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[#7A7065]">
                      {inv.primaryFreelancerName || 'A freelancer'} invited you as <strong>{inv.role}</strong> · {timeAgo(inv.createdAt)}
                    </p>
                    {inv.message && <p className="mt-1.5 rounded-[10px] bg-[#FAF7F2] p-2.5 text-[12.5px] text-[#5C5248]">{inv.message}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {inv.status === 'INVITED' ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === inv.id}
                          onClick={() => respond(inv, false)}
                          className="rounded-full border border-[#E5DACD] px-4 py-2 text-[12.5px] font-bold text-[#5C5248] hover:bg-[#FAF7F2] disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          disabled={busyId === inv.id}
                          onClick={() => respond(inv, true)}
                          className="rounded-full bg-[#C06B3E] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#AA572D] disabled:opacity-50"
                        >
                          Accept
                        </button>
                      </>
                    ) : inv.status === 'ACCEPTED' ? (
                      <>
                        <button type="button" onClick={() => messageInviter(inv)} className="rounded-full border border-[#E5DACD] px-4 py-2 text-[12.5px] font-bold text-[#08182B]">
                          Message
                        </button>
                        <Link to={`/freelancer/projects/${toRouteId(inv.projectId)}`} className="rounded-full bg-[#08182B] px-4 py-2 text-[12.5px] font-bold text-white no-underline">
                          Open workspace
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'sent' && (
          <div className="flex flex-col gap-3">
            {sent.length === 0 ? (
              <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-10 text-center text-[13px] text-[#8E8376]">
                <Users2 size={26} className="mb-2 text-[#C5B8A8]" />
                You haven't invited anyone yet.
              </div>
            ) : (
              sent.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 rounded-[18px] border border-[#EBEBEB] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar p={{ id: inv.collaboratorFreelancerId, fullName: inv.collaboratorName || '?', avatarUrl: inv.collaboratorAvatarUrl }} size="h-10 w-10" text="text-[14px]" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[14.5px] font-bold text-[#08182B]">{inv.collaboratorName || 'Freelancer'}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[inv.status]}`}>
                          {inv.status === 'INVITED' ? 'Pending' : inv.status === 'ACCEPTED' ? 'Joined' : 'Declined'}
                        </span>
                      </div>
                      <p className="truncate text-[12.5px] text-[#7A7065]">
                        {inv.role} · {inv.projectTitle} · {timeAgo(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link to={`/freelancer/projects/${toRouteId(inv.projectId)}`} className="rounded-full border border-[#E5DACD] px-4 py-2 text-[12.5px] font-bold text-[#08182B] no-underline">
                      Workspace
                    </Link>
                    {inv.status !== 'DECLINED' && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => cancelInvite(inv)}
                        className="rounded-full px-3 py-2 text-[12.5px] font-bold text-[#94A3B8] hover:text-red-600 disabled:opacity-50"
                      >
                        {inv.status === 'ACCEPTED' ? 'Remove' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modalStep && selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" onClick={handleCloseModal}>
          <div
            role="dialog"
            aria-modal="true"
            className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px] ${
              modalStep === 'view-profile' ? 'sm:max-w-[760px]' : 'sm:max-w-[480px]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#F4F4F5] bg-white px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <h3 className="font-manrope text-[18px] font-bold text-[#08182B]">
                  {modalStep === 'invite-form' ? 'Invite to Collaborate' : modalStep === 'view-profile' ? 'Freelancer Profile' : 'Invitation Sent'}
                </h3>
                {modalStep === 'invite-form' && <p className="mt-0.5 font-manrope text-[12px] text-[#71717A]">Send a collaboration invitation to {selected.fullName}</p>}
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F4F5] text-[#71717A] transition-colors hover:bg-[#E4E4E7]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              {modalStep === 'view-profile' && profileForModal && (
                <div className="grid grid-cols-1 items-start gap-6 font-manrope md:grid-cols-12">
                  <div className="flex flex-col gap-5 md:col-span-5">
                    <div className="flex flex-col items-center rounded-[20px] border border-[#EBEBEB] bg-white p-6 text-center shadow-xs">
                      <Avatar p={profileForModal} size="h-20 w-20" text="text-[24px]" />
                      <h4 className="mt-3.5 font-manrope text-[18px] font-extrabold text-[#08182B]">{profileForModal.fullName}</h4>
                      <p className="mt-0.5 font-manrope text-[13px] text-[#786D61]">{profileForModal.professionalTitle || 'Freelancer'}</p>
                      <div className="mt-2 flex items-center gap-1 font-manrope text-[13px] font-bold text-[#08182B]">
                        <Star size={14} className={ratingLabel(profileForModal) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#CBD5E1]'} />
                        {ratingLabel(profileForModal) ? (
                          <>
                            <span>{ratingLabel(profileForModal)}</span>
                            <span className="font-medium text-[#8E8376]">({profileForModal.completedProjects} projects)</span>
                          </>
                        ) : (
                          <span className="font-medium text-[#8E8376]">No reviews yet</span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col gap-1.5 text-[12px] font-medium text-[#71717A]">
                        {profileForModal.location && (
                          <div className="flex items-center justify-center gap-1.5">
                            <MapPin size={13} className="text-[#9E9284]" />
                            <span>{profileForModal.location}</span>
                          </div>
                        )}
                        {profileForModal.availability && (
                          <div className="flex items-center justify-center gap-1.5 font-semibold text-[#1F874C]">
                            <Clock size={13} />
                            <span>{profileForModal.availability}</span>
                          </div>
                        )}
                      </div>
                      {invitableProjects.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenInvite(selected)}
                          className="mt-5 w-full rounded-[14px] bg-[#1E293B] py-3 font-manrope text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-[#0F172A]"
                        >
                          Invite to Collaborate
                        </button>
                      )}
                    </div>

                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <span className="block pb-3 font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">STATS</span>
                      <div className="space-y-3 font-manrope text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Projects Completed</span>
                          <span className="font-extrabold text-[#08182B]">{profileForModal.completedProjects}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Experience</span>
                          <span className="font-extrabold text-[#08182B]">{profileForModal.experienceYears != null ? `${profileForModal.experienceYears}+ years` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Hourly Rate</span>
                          <span className="font-extrabold text-[#08182B]">{profileForModal.hourlyRate != null ? `${formatINR(profileForModal.hourlyRate)}/hr` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#71717A]">Leaderboard</span>
                          <span className="font-extrabold text-[#08182B]">{profileForModal.rank ? `#${profileForModal.rank}` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5 md:col-span-7">
                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">About</h4>
                      <p className="mt-2.5 whitespace-pre-line font-manrope text-[13px] leading-relaxed text-[#594E42]">
                        {profileForModal.bio || 'This freelancer has not written a bio yet.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
                        {profileForModal.portfolioUrl && (
                          <a href={profileForModal.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#C06B3E]">
                            Website <ExternalLink size={11} />
                          </a>
                        )}
                        {profileForModal.githubUrl && (
                          <a href={profileForModal.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#C06B3E]">
                            GitHub <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">Skills</h4>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {profileForModal.skills.length === 0 && <span className="text-[12.5px] text-[#A1A1AA]">No skills listed.</span>}
                        {profileForModal.skills.map((skill) => (
                          <span key={skill} className="rounded-[10px] border border-[#E5E5E5] bg-[#FAF8F5] px-3 py-1.5 font-manrope text-[12px] font-medium text-[#4A4036]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-[#EBEBEB] bg-white p-5 shadow-xs">
                      <h4 className="pb-3 font-manrope text-[15px] font-bold text-[#08182B]">Portfolio</h4>
                      {!fullProfile ? (
                        <p className="text-[12.5px] text-[#A1A1AA]">Loading…</p>
                      ) : profileForModal.portfolio.length === 0 ? (
                        <p className="text-[12.5px] text-[#A1A1AA]">No portfolio projects yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                          {profileForModal.portfolio.map((item, pIdx) => (
                            <a
                              key={item.id || pIdx}
                              href={item.link || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col overflow-hidden rounded-[16px] border border-[#EFECE6] bg-white no-underline shadow-2xs transition-all hover:border-[#C06B3E]/40"
                            >
                              {item.imageUrl ? (
                                <img src={fileUrl(item.imageUrl)} alt={item.title} className="h-24 w-full object-cover" />
                              ) : (
                                <div className={`flex h-24 w-full items-center justify-center bg-gradient-to-br ${PORTFOLIO_BG[pIdx % PORTFOLIO_BG.length]}`}>
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#1E293B]">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                                  </svg>
                                </div>
                              )}
                              <div className="p-3">
                                <h5 className="font-manrope text-[13px] font-bold text-[#08182B]">{item.title}</h5>
                                <p className="font-manrope text-[11px] text-[#8E8376]">{[item.category, item.year].filter(Boolean).join(' · ')}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 'invite-form' && (
                <form onSubmit={handleSendInvitation} className="space-y-4">
                  <div className="flex items-center gap-3.5 rounded-[16px] border border-[#F0ECE6] bg-[#FAF8F5] p-3.5">
                    <Avatar p={selected} size="h-11 w-11" text="text-[15px]" />
                    <div>
                      <h4 className="font-manrope text-[14.5px] font-bold text-[#08182B]">{selected.fullName}</h4>
                      <p className="font-manrope text-[12px] text-[#786D61]">{selected.professionalTitle || 'Freelancer'}</p>
                    </div>
                  </div>

                  <label className="block font-manrope text-[12px] font-medium text-[#71717A]">
                    Project
                    <div className="relative mt-1">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="w-full appearance-none rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 pr-8 font-manrope text-[13px] font-medium text-[#18181B] outline-none focus:border-[#C06B3E]"
                      >
                        {invitableProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                            {p.clientName ? ` — ${p.clientName}` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                    </div>
                  </label>

                  <label className="block font-manrope text-[12px] font-medium text-[#71717A]">
                    Their role on the project
                    <input
                      value={inviteRole}
                      maxLength={80}
                      onChange={(e) => setInviteRole(e.target.value)}
                      placeholder="e.g. UI Designer, QA Tester"
                      className="mt-1 w-full rounded-[12px] border border-[#E4E4E7] bg-white px-3.5 py-2.5 font-manrope text-[13px] text-[#18181B] outline-none focus:border-[#C06B3E]"
                    />
                  </label>

                  <label className="block font-manrope text-[12px] font-medium text-[#71717A]">
                    Invitation Message
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={invitationMessage}
                      onChange={(e) => setInvitationMessage(e.target.value)}
                      className="mt-1 w-full resize-none rounded-[14px] border border-[#E4E4E7] bg-white p-3 font-manrope text-[13px] leading-relaxed text-[#18181B] outline-none focus:border-[#C06B3E] focus:ring-1 focus:ring-[#C06B3E]/30"
                    />
                  </label>

                  {modalError && <p className="text-[12.5px] font-semibold text-red-600">{modalError}</p>}

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 rounded-[12px] border border-[#E4E4E7] bg-white py-3 font-manrope text-[13.5px] font-semibold text-[#52525B] transition-colors hover:bg-[#F4F4F5]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-[#C06B3E] py-3 font-manrope text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-[#AA572D] disabled:opacity-60"
                    >
                      <Send size={14} />
                      <span>{sending ? 'Sending…' : 'Send Invitation'}</span>
                    </button>
                  </div>
                </form>
              )}

              {modalStep === 'invitation-sent' && lastInvite && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center justify-center rounded-[20px] border border-[#BBF7D0] bg-[#E9F9EE] p-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#16A34A] shadow-xs">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="font-manrope text-[20px] font-extrabold text-[#15803D]">Invitation Sent!</h3>
                    <p className="mt-1 font-manrope text-[13px] text-[#166534]">
                      {selected.fullName} has been notified. You'll get a notification when they respond.
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-[#E5E5E5] bg-white p-4 shadow-2xs">
                    <span className="block pb-3 font-manrope text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">PENDING INVITATION</span>
                    <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar p={selected} size="h-10 w-10" text="text-[14px]" />
                        <div>
                          <h4 className="font-manrope text-[14px] font-bold text-[#08182B]">{selected.fullName}</h4>
                          <p className="font-manrope text-[12px] text-[#71717A]">{lastInvite.role}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-2.5 py-0.5 font-manrope text-[11px] font-bold text-[#D97706]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D97706]" />
                        Pending
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 font-manrope text-[12.5px] text-[#52525B]">
                      <span className="text-[#8E8376]">Project:</span>
                      <span className="font-bold text-[#08182B]">{lastInvite.projectTitle || projectTitle(lastInvite.projectId)}</span>
                    </div>
                  </div>

                  <Link
                    to={`/freelancer/projects/${toRouteId(lastInvite.projectId)}`}
                    className="flex h-12 w-full items-center justify-center rounded-[14px] bg-[#C06B3E] font-manrope text-[14px] font-bold text-white no-underline shadow-sm transition-all hover:bg-[#AA572D]"
                  >
                    Go to Project Workspace
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
