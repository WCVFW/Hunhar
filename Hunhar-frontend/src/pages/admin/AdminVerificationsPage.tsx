import React, { useState } from 'react'
import {
  ShieldCheck,
  FileCheck,
  Check,
  X,
  ExternalLink,
  Building2,
  User,
} from 'lucide-react'


interface KycApplication {
  id: string
  userName: string
  userEmail: string
  role: 'Freelancer' | 'Client'
  documentType: string
  idNumber: string
  submittedAt: string
  status: 'Pending' | 'Approved' | 'Rejected'
  portfolioOrGst: string
}

const mockKycList: KycApplication[] = [
  {
    id: 'KYC-901',
    userName: 'Praveen Kumar',
    userEmail: 'praveen.ux@gmail.com',
    role: 'Freelancer',
    documentType: 'Aadhaar Card + Selfie Verification',
    idNumber: '•••• •••• 4819',
    submittedAt: 'Today, 2:15 PM',
    status: 'Pending',
    portfolioOrGst: 'behance.net/praveen-ui',
  },
  {
    id: 'KYC-902',
    userName: 'Apex Global Tech Ltd',
    userEmail: 'finance@apexglobal.in',
    role: 'Client',
    documentType: 'GSTIN Certificate & PAN',
    idNumber: '33AAAAA0000A1Z5',
    submittedAt: 'Today, 11:30 AM',
    status: 'Pending',
    portfolioOrGst: 'apexglobal.in',
  },
  {
    id: 'KYC-903',
    userName: 'Ananya Sharma',
    userEmail: 'ananya.code@gmail.com',
    role: 'Freelancer',
    documentType: 'Passport & Degree Certificate',
    idNumber: 'Z •••• 982',
    submittedAt: 'Yesterday',
    status: 'Pending',
    portfolioOrGst: 'github.com/ananya-dev',
  },
  {
    id: 'KYC-904',
    userName: 'Rohan Mehra',
    userEmail: 'rohan.designs@yahoo.com',
    role: 'Freelancer',
    documentType: 'Driving License',
    idNumber: 'DL-04 •••• 129',
    submittedAt: 'Oct 20, 2026',
    status: 'Approved',
    portfolioOrGst: 'dribbble.com/rohanm',
  },
]

export default function AdminVerificationsPage(): React.JSX.Element {
  const [kycData, setKycData] = useState<KycApplication[]>(mockKycList)
  const [selectedKyc, setSelectedKyc] = useState<KycApplication>(mockKycList[0])

  const handleDecision = (id: string, status: 'Approved' | 'Rejected') => {
    setKycData((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status } : k))
    )
    if (selectedKyc.id === id) {
      setSelectedKyc((prev) => ({ ...prev, status }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#08182B]">
          KYC & Identity Verification Queue
        </h1>
        <p className="text-sm text-[#8E8376]">
          Verify government documents, GST compliance, and identity to assign Verified Badges.
        </p>
      </div>

      {/* Split view: Applications list on left, Document Inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-[20px] bg-white p-3 border border-[#E5DACD] shadow-xs">
            <span className="text-xs font-bold text-[#08182B] px-1">
              Applications ({kycData.filter((k) => k.status === 'Pending').length} Pending)
            </span>
          </div>

          {kycData.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedKyc(item)}
              className={`cursor-pointer rounded-[20px] bg-white p-4 border transition-all ${
                selectedKyc.id === item.id
                  ? 'border-[#C06B3E] shadow-sm ring-2 ring-[#C06B3E]/10'
                  : 'border-[#E5DACD] hover:border-[#C06B3E]/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#08182B]">{item.userName}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        item.role === 'Freelancer'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E8376] mt-0.5">{item.userEmail}</p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : item.status === 'Rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8E8376]">
                <span>{item.documentType.split('+')[0]}</span>
                <span>{item.submittedAt}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Inspector Panel */}
        <div className="lg:col-span-7 rounded-[24px] bg-white p-6 border border-[#E5DACD] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#F8F4EE] border border-[#E5DACD] flex items-center justify-center text-[#C06B3E]">
                  {selectedKyc.role === 'Freelancer' ? <User size={24} /> : <Building2 size={24} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#08182B]">{selectedKyc.userName}</h2>
                  <p className="text-xs text-[#8E8376]">{selectedKyc.userEmail} · Application {selectedKyc.id}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#8E8376]">Current State</span>
                <p className="text-sm font-bold text-[#C06B3E]">{selectedKyc.status}</p>
              </div>
            </div>

            {/* Document Details Block */}
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                  <span className="text-[11px] text-[#8E8376] font-medium">Document Submitted</span>
                  <p className="text-sm font-bold text-[#08182B] mt-0.5">{selectedKyc.documentType}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                  <span className="text-[11px] text-[#8E8376] font-medium">ID Number / Reg No.</span>
                  <p className="text-sm font-bold text-[#08182B] font-mono mt-0.5">{selectedKyc.idNumber}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F4EE] border border-[#E5DACD]">
                <span className="text-[11px] text-[#8E8376] font-medium">Portfolio / Company URL</span>
                <p className="text-sm font-bold text-[#C06B3E] flex items-center gap-1 mt-0.5">
                  {selectedKyc.portfolioOrGst} <ExternalLink size={13} />
                </p>
              </div>

              {/* Mock ID Card Preview Window */}
              <div className="rounded-2xl border-2 border-dashed border-[#E5DACD] p-8 text-center bg-[#FAFAF8]">
                <FileCheck size={40} className="mx-auto text-[#C06B3E]/60 mb-2" />
                <p className="text-sm font-bold text-[#08182B]">Official Document Preview</p>
                <p className="text-xs text-[#8E8376] mt-1 max-w-sm mx-auto">
                  Aadhaar / Government photo document is cryptographically verified against DigiLocker API sandbox.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#08182B] border border-[#E5DACD] shadow-xs">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Checksum Matches UIDAI Records
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-[#F0EAE1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => handleDecision(selectedKyc.id, 'Rejected')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <X size={15} />
              Reject Document
            </button>
            <button
              type="button"
              onClick={() => handleDecision(selectedKyc.id, 'Approved')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Check size={15} />
              Approve & Assign Badge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
