import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bidsApi, type Bid, type BidStatus } from '../../services/api'
import { FileText, ArrowRight } from 'lucide-react'
import { BID_STATUS_LABEL, BID_STATUS_STYLE, formatDate, formatINR } from '../../services/format'

type FilterKey = 'ALL' | BidStatus

interface BidItem {
  id: string
  projectId: string
  title: string
  client: string
  category: string
  status: BidStatus
  amount: string
  submittedDate: string
  statusMessage: string
  deadline: string
  actionType: 'workspace' | 'withdraw' | 'none'
}

const STATUS_MESSAGE: Record<BidStatus, string> = {
  SUBMITTED: 'Awaiting client review.',
  SHORTLISTED: 'The client shortlisted your proposal.',
  AWARDED: 'Congratulations! Your proposal was accepted.',
  REJECTED: 'The client chose another proposal.',
  WITHDRAWN: 'You withdrew this proposal.',
}

const toItem = (b: Bid): BidItem => ({
  id: b.id,
  projectId: b.projectId,
  title: b.projectTitle || 'Project',
  client: b.clientName || 'Client',
  category: b.projectCategory || 'General',
  status: b.status,
  amount: formatINR(b.proposedCost),
  submittedDate: `Submitted ${formatDate(b.createdAt, true)}`,
  statusMessage:
    b.status === 'SUBMITTED' && b.projectStatus && b.projectStatus !== 'OPEN'
      ? 'This project is no longer open.'
      : STATUS_MESSAGE[b.status],
  deadline: `Delivery: ${b.deliveryTimelineDays} day${b.deliveryTimelineDays === 1 ? '' : 's'}`,
  actionType:
    b.status === 'AWARDED'
      ? 'workspace'
      : (b.status === 'SUBMITTED' || b.status === 'SHORTLISTED') && b.projectStatus === 'OPEN'
      ? 'withdraw'
      : 'none',
})

export default function MyBidsPage(): React.JSX.Element {
  const [bids, setBids] = useState<BidItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<FilterKey>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    bidsApi
      .getMyBids()
      .then((res) => setBids(res.map(toItem)))
      .catch((err) => setError(err.message || 'Could not load your proposals'))
      .finally(() => setLoading(false))
  }, [])

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Withdraw this proposal? The credits used to submit it are not refunded.')) return
    setBusyId(id)
    setError('')
    try {
      const updated = await bidsApi.withdrawBid(id)
      setBids((prev) => prev.map((b) => (b.id === id ? toItem(updated) : b)))
    } catch (err: any) {
      setError(err.message || 'Could not withdraw the proposal')
    } finally {
      setBusyId(null)
    }
  }

  const visibleBids = filter === 'ALL' ? bids : bids.filter((b) => b.status === filter)

  const totalBids = bids.length
  const pendingCount = bids.filter((b) => b.status === 'SUBMITTED').length
  const shortlistedCount = bids.filter((b) => b.status === 'SHORTLISTED').length
  const acceptedCount = bids.filter((b) => b.status === 'AWARDED').length
  const filters: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: `All (${totalBids})` },
    { key: 'SUBMITTED', label: 'Pending' },
    { key: 'SHORTLISTED', label: 'Shortlisted' },
    { key: 'AWARDED', label: 'Accepted' },
    { key: 'REJECTED', label: 'Not selected' },
    { key: 'WITHDRAWN', label: 'Withdrawn' },
  ]

  return (
    <div className="w-full font-manrope">
      {/* Outer White Card Container matching image */}
      <div className="w-full rounded-[24px] bg-[#FFFFFF] p-6 sm:p-8 lg:p-9 shadow-sm">
        {/* Title & Subtitle */}
        <div className="mb-8">
          <h1 className="font-manrope text-[20px] font-bold text-[#C06B3E]">
            My Bids
          </h1>
          <p className="mt-1 font-manrope text-[13px] text-[#8C9BA8]">
            Track all your live proposals and client contract statuses
          </p>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-4.5 lg:gap-5">
          {/* Card 1: TOTAL BIDS */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              TOTAL BIDS
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              {totalBids}
            </span>
          </div>

          {/* Card 2: PENDING */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              PENDING
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              {pendingCount}
            </span>
          </div>

          {/* Card 3: SHORTLISTED */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              SHORTLISTED
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              {shortlistedCount}
            </span>
          </div>

          {/* Card 4: ACCEPTED */}
          <div className="flex min-h-[96px] flex-col justify-between rounded-[18px] border border-[#DEBBA5] bg-[#F7F2EC] px-5 py-4 transition-all">
            <span className="font-manrope text-[10.5px] font-bold tracking-wider text-[#8C9BA8] uppercase">
              ACCEPTED
            </span>
            <span className="font-manrope text-[28px] font-semibold leading-none text-[#1A202C]">
              {acceptedCount}
            </span>
          </div>
        </div>

        {/* Status filter */}
        {bids.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2" role="tablist">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3.5 py-1.5 font-manrope text-[12px] font-bold transition-colors ${
                  filter === f.key ? 'bg-[#08182B] text-white' : 'bg-[#F7F2EC] text-[#5C5248] hover:bg-[#EFE5DB]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>
        )}

        {/* Bids List */}
        <div className="mt-4 flex flex-col space-y-4">
          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-[18px] border border-[#EBEBEB] bg-[#FDFBF7] p-8">
              <span className="font-manrope text-[13px] font-medium text-[#8C9BA8]">Loading your proposals…</span>
            </div>
          ) : bids.length > 0 && visibleBids.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-8 text-center font-manrope text-[13px] text-[#8E8376]">
              No proposals with this status.
            </div>
          ) : bids.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#DECFBE] bg-[#FAF7F2] p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5ECE1] text-[#C06B3E] mb-3">
                <FileText size={24} />
              </div>
              <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">No proposals submitted yet</h3>
              <p className="mt-1 font-manrope text-[13px] text-[#8E8376] max-w-[400px]">
                Browse open projects and send your first proposal. Each proposal uses 2 credits.
              </p>
              <Link
                to="/freelancer/browse"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#C06B3E] px-5 py-2 font-manrope text-[13px] font-bold text-white shadow-xs hover:bg-[#AA572D]"
              >
                Find Projects to Bid On <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            visibleBids.map((bid) => {
              return (
                <div
                  key={bid.id}
                  className="group relative flex flex-col justify-between rounded-[18px] border border-[#EBEBEB] bg-[#FFFFFF] p-5 sm:p-6 transition-all duration-150 hover:border-[#DCDCDC]"
                >
                  {/* Header row: Title + Status Pill & Amount + Date */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col">
                      {/* Title & Badge */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link to={`/freelancer/browse/${bid.projectId}`} className="font-manrope text-[15px] font-bold text-[#111827] no-underline hover:text-[#C06B3E]">
                          {bid.title}
                        </Link>
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-bold ${BID_STATUS_STYLE[bid.status]}`}
                        >
                          {BID_STATUS_LABEL[bid.status]}
                        </span>
                      </div>

                      {/* Client & Category Subtext */}
                      <p className="mt-1 font-manrope text-[12.5px] text-[#6B7280]">
                        {bid.client} • {bid.category}
                      </p>
                    </div>

                    {/* Amount & Date */}
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="font-manrope text-[16px] font-extrabold text-[#111827]">
                        {bid.amount}
                      </span>
                      <span className="font-manrope text-[11.5px] text-[#9CA3AF]">
                        {bid.submittedDate}
                      </span>
                    </div>
                  </div>

                  {/* Body row: Status Message & Deadline */}
                  <div className="mt-3 flex flex-col gap-1 border-t border-[#F3F4F6] pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-manrope text-[12.5px] text-[#4B5563]">
                      {bid.statusMessage}
                    </p>
                    <span className="font-manrope text-[12px] font-medium text-[#9CA3AF]">
                      {bid.deadline}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {bid.actionType === 'workspace' && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        to={`/freelancer/projects/${bid.projectId}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#C06B3E] px-4 py-1.5 font-manrope text-[12px] font-bold text-white no-underline transition-colors hover:bg-[#A95A30]"
                      >
                        Open Workspace
                      </Link>
                    </div>
                  )}

                  {bid.actionType === 'withdraw' && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleWithdraw(bid.id)}
                        disabled={busyId === bid.id}
                        className="font-manrope text-[12px] font-medium text-[#9CA3AF] transition-colors hover:text-[#EF4444] disabled:opacity-50"
                      >
                        {busyId === bid.id ? 'Withdrawing…' : 'Withdraw proposal'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
