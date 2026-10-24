import React, { useState } from 'react'
import {
  Scale,
} from 'lucide-react'



interface DisputeCase {
  id: string
  project: string
  amount: string
  client: string
  freelancer: string
  reason: string
  status: 'Under Investigation' | 'Client Evidence Needed' | 'Resolved'
  openedDate: string
  clientClaim: string
  freelancerClaim: string
}

const mockDisputes: DisputeCase[] = [
  {
    id: 'DSP-104',
    project: 'E-commerce React Migration',
    amount: '₹ 45,000',
    client: 'TechNova Labs (Rakesh)',
    freelancer: 'Rohan Mehra',
    reason: 'Code quality does not meet milestone specifications; broken cart checkout.',
    status: 'Under Investigation',
    openedDate: 'Oct 22, 2026',
    clientClaim: 'We specified Next.js 14 App router with Tailwind and Jest tests. The delivered milestone has zero test coverage and breaking runtime crashes in cart.',
    freelancerClaim: 'The client updated API schema midway without revision budget. Cart backend was returning 500 status from client server.',
  },
  {
    id: 'DSP-103',
    project: 'Mobile Fintech Branding',
    amount: '₹ 22,000',
    client: 'PayPulse Inc',
    freelancer: 'Vikram Sethi',
    reason: 'Client became unresponsive after receiving high resolution vector assets.',
    status: 'Client Evidence Needed',
    openedDate: 'Oct 19, 2026',
    clientClaim: 'Waiting for stakeholder feedback meeting scheduled for Friday.',
    freelancerClaim: 'Asset delivery was acknowledged in chat 14 days ago. Approval has been intentionally delayed beyond auto-release window.',
  },
]

export default function AdminDisputesPage(): React.JSX.Element {
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase>(mockDisputes[0])
  const [resolutionNote, setResolutionNote] = useState('')
  const [disputeList, setDisputeList] = useState<DisputeCase[]>(mockDisputes)

  const handleResolve = (action: 'Release to Freelancer' | 'Refund Client' | 'Split 50/50') => {
    alert(`Dispute ${selectedDispute.id} marked as resolved via: ${action}`)
    setDisputeList((prev) =>
      prev.map((d) => (d.id === selectedDispute.id ? { ...d, status: 'Resolved' } : d))
    )
    setSelectedDispute((prev) => ({ ...prev, status: 'Resolved' }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">
          Dispute Arbitration & Resolution Tribunal
        </h1>
        <p className="text-sm text-[#8E8376]">
          Impartial moderation between clients and freelancers to ensure trust and fair escrow outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of cases */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
            <span className="text-xs font-bold text-[#08182B] px-1">
              Active Disputes ({disputeList.filter((d) => d.status !== 'Resolved').length})
            </span>
          </div>

          {disputeList.map((dsp) => (
            <div
              key={dsp.id}
              onClick={() => setSelectedDispute(dsp)}
              className={`cursor-pointer rounded-[20px] bg-white p-4 border transition-all ${
                selectedDispute.id === dsp.id
                  ? 'border-[#C06B3E] shadow-sm ring-2 ring-[#C06B3E]/10'
                  : 'border-[#E5DACD] hover:border-[#C06B3E]/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                      {dsp.id}
                    </span>
                    <h3 className="font-bold text-sm text-[#08182B]">{dsp.project}</h3>
                  </div>
                  <p className="text-xs text-[#8E8376] mt-1 line-clamp-1">{dsp.reason}</p>
                </div>
                <span className="text-sm font-bold text-[#08182B] shrink-0">{dsp.amount}</span>
              </div>

              <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8E8376]">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dsp.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {dsp.status}
                </span>
                <span>Opened {dsp.openedDate}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Case Deep Dive */}
        <div className="lg:col-span-7 rounded-[24px] bg-white p-6 border border-[#E5DACD] shadow-xs flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-[#F0EAE1] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-100 text-rose-800 text-[11px] font-mono px-2 py-0.5 font-bold">
                    {selectedDispute.id}
                  </span>
                  <h2 className="text-lg font-bold text-[#08182B]">{selectedDispute.project}</h2>
                </div>
                <p className="text-xs text-[#8E8376] mt-1">Dispute Amount at stake: <strong className="text-rose-600 font-bold">{selectedDispute.amount}</strong></p>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  selectedDispute.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {selectedDispute.status}
              </span>
            </div>

            {/* Testimony side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Statement */}
              <div className="p-4 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    C
                  </div>
                  <span className="text-xs font-bold text-[#08182B]">{selectedDispute.client}</span>
                </div>
                <p className="text-xs text-[#524B42] leading-relaxed italic">
                  "{selectedDispute.clientClaim}"
                </p>
              </div>

              {/* Freelancer Statement */}
              <div className="p-4 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    F
                  </div>
                  <span className="text-xs font-bold text-[#08182B]">{selectedDispute.freelancer}</span>
                </div>
                <p className="text-xs text-[#524B42] leading-relaxed italic">
                  "{selectedDispute.freelancerClaim}"
                </p>
              </div>
            </div>

            {/* Admin Arbitration Form */}
            <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5DACD] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#08182B]">
                <Scale size={16} className="text-[#C06B3E]" />
                Hunhar Escrow Ruling Officer Action
              </div>

              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Enter mandatory arbitration decision rationale for permanent audit logs..."
                className="w-full rounded-xl border border-[#E5DACD] bg-white p-3 text-xs text-[#08182B] placeholder-[#9D9183] focus:border-[#C06B3E] focus:outline-none focus:ring-2 focus:ring-[#C06B3E]/20"
              />

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleResolve('Release to Freelancer')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                >
                  Rule in Favor of Freelancer (Release Funds)
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve('Refund Client')}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
                >
                  Rule in Favor of Client (Refund)
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve('Split 50/50')}
                  className="rounded-xl border border-[#E5DACD] bg-white px-4 py-2 text-xs font-bold text-[#08182B] hover:bg-[#F8F4EE] transition-colors"
                >
                  Mutual 50% Compromise Split
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
