import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export type LegalKind = 'terms' | 'privacy' | 'refund' | 'contact'

const SUPPORT_EMAIL = 'howdy@theunoia.com'
const UPDATED = '9 November 2026'

interface Section {
  heading: string
  body: React.ReactNode[]
}

interface LegalDoc {
  title: string
  intro: string
  sections: Section[]
}

const DOCS: Record<LegalKind, LegalDoc> = {
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms govern your use of hunhar.in, a marketplace where businesses ("Clients") hire students and freelancers ("Freelancers") for project work. By creating an account or using the site you agree to them.',
    sections: [
      {
        heading: '1. Accounts',
        body: [
          'You must give accurate details, verify your email (and mobile number where asked) and keep your password private. You are responsible for everything done through your account.',
          'One person or business may hold one account per role. We may suspend accounts that give false information, misuse the platform or break these terms.',
        ],
      },
      {
        heading: '2. Projects, proposals and hiring',
        body: [
          'Clients post projects with a budget and timeline. Freelancers send proposals; sending a proposal uses bid credits as shown on the site before you confirm.',
          'When a Client hires a Freelancer, the agreed scope, milestones and amounts shown in the project workspace form the agreement between them. Hunhar is not a party to that agreement and does not employ Freelancers.',
        ],
      },
      {
        heading: '3. Payments and milestone escrow',
        body: [
          'Payments are processed by Razorpay. Clients add money to their Hunhar wallet and fund each milestone before work on it starts; the funded amount is held until the Client approves the work and releases it.',
          'On release, the Freelancer receives the milestone amount less the platform commission shown on the site at the time. Freelancers can withdraw their balance to a verified UPI ID or bank account after completing KYC.',
          'All amounts are in Indian Rupees. Taxes, where applicable, are shown on invoices.',
        ],
      },
      {
        heading: '4. Your work and content',
        body: [
          'Freelancers keep ownership of their work until the Client pays for it; once a milestone is released, ownership of that milestone\'s deliverables passes to the Client unless both agree otherwise in writing.',
          'You must not upload anything illegal, infringing, harmful or misleading. We may remove such content.',
        ],
      },
      {
        heading: '5. Disputes',
        body: [
          'If a Client and Freelancer cannot agree, either can raise a dispute from the project. Hunhar reviews the project history, messages and deliverables. Where the work cannot continue, Hunhar cancels the project and any funded milestone that has not been released goes back to the Client\'s wallet.',
        ],
      },
      {
        heading: '6. Prohibited use',
        body: [
          'You must not take payments for Hunhar projects outside the platform, contact users to avoid fees, create fake reviews or accounts, scrape the site, or attempt to break its security.',
        ],
      },
      {
        heading: '7. Liability',
        body: [
          'Hunhar provides the platform "as is". We are not responsible for the quality of work delivered or for the conduct of users, and our total liability for any claim is limited to the fees we received from you in the three months before the claim.',
        ],
      },
      {
        heading: '8. Changes and governing law',
        body: [
          'We may update these terms; the date at the top shows the latest version, and continuing to use the site means you accept it. These terms are governed by the laws of India.',
          <>Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</>,
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what personal data hunhar.in collects, why, and the choices you have. We follow the Digital Personal Data Protection Act, 2023.',
    sections: [
      {
        heading: '1. What we collect',
        body: [
          'Account details: name, email address, mobile number, role, password (stored only as a one-way hash), and your Google profile name, email and photo if you sign in with Google.',
          'Profile and work: skills, education, portfolio, company details, projects, proposals, messages, files you upload and reviews.',
          'Verification and payouts: Aadhaar details and the document you submit for KYC, PAN and bank or UPI details for withdrawals. Sensitive numbers are stored encrypted and only the last digits are shown.',
          'Payments: wallet top-ups, milestone payments and payouts. Card and UPI details are entered on Razorpay\'s checkout and never reach our servers.',
          'Technical data: IP address, browser type and logs needed to keep the service secure.',
        ],
      },
      {
        heading: '2. How we use it',
        body: [
          'To run your account and the marketplace, verify identity, process payments and payouts, send one-time passwords and notifications, prevent fraud, resolve disputes and meet legal obligations. We do not sell your personal data.',
        ],
      },
      {
        heading: '3. Who we share it with',
        body: [
          'Other users see your public profile and the details needed for a project you are part of. We use service providers that process data on our behalf: Amazon Web Services (hosting, Mumbai region), Razorpay (payments), Resend (email), Fast2SMS (SMS) and Google (sign-in). We share data with authorities only when the law requires it.',
        ],
      },
      {
        heading: '4. Storage and security',
        body: [
          'Data is stored on servers in India. Connections use HTTPS and API traffic is additionally encrypted end to end. Access to production systems is restricted to authorised staff.',
        ],
      },
      {
        heading: '5. How long we keep it',
        body: [
          'We keep account data while your account is active. Payment, invoice and KYC records are kept for the period required by Indian tax and financial laws, then deleted.',
        ],
      },
      {
        heading: '6. Your rights',
        body: [
          'You can view and correct your details in Settings, and ask us to export or delete your data or withdraw consent. Some records may be kept where the law requires it.',
          <>Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will respond within 30 days.</>,
        ],
      },
      {
        heading: '7. Cookies and local storage',
        body: [
          'We use your browser\'s storage to keep you signed in and remember preferences. We do not use advertising cookies.',
        ],
      },
    ],
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    intro: 'How cancellations and refunds work for payments made on hunhar.in.',
    sections: [
      {
        heading: '1. Wallet balance',
        body: [
          'Money added to your wallet stays in your wallet until you use it. Unused wallet balance can be refunded on request to the original payment method.',
        ],
      },
      {
        heading: '2. Milestone escrow',
        body: [
          'A funded milestone that has not been released goes back to the Client\'s wallet if the project is cancelled, including when Hunhar cancels it after reviewing a dispute. Released milestones are final and are not refundable.',
        ],
      },
      {
        heading: '3. Bid credits',
        body: [
          'Credit packs are digital services delivered immediately and are not refundable once purchased. Credits used on a proposal are not returned if the proposal is not accepted.',
        ],
      },
      {
        heading: '4. Cancelling a project',
        body: [
          'A Client can cancel a project at no charge before hiring anyone. After hiring, raise a dispute from the project; Hunhar reviews it and can cancel the project so that unreleased funds return to the Client.',
        ],
      },
      {
        heading: '5. How refunds are paid',
        body: [
          'Approved refunds are processed within 5–7 working days to the original payment method through Razorpay. Your bank may take a few more days to show the credit.',
          <>To request a refund, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your registered email and the transaction ID.</>,
        ],
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    intro: 'We are here to help with accounts, projects, payments and anything else on hunhar.in.',
    sections: [
      {
        heading: 'Email',
        body: [
          <><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> — we reply within one working day.</>,
        ],
      },
      {
        heading: 'Payments and refunds',
        body: [
          'Include your registered email and the transaction or order ID so we can find the payment quickly.',
        ],
      },
      {
        heading: 'Project disputes',
        body: [
          'Raise a dispute from the project page so the full project history is attached. Our team reviews every dispute.',
        ],
      },
    ],
  },
}

const LINKS: { kind: LegalKind; label: string; to: string }[] = [
  { kind: 'terms', label: 'Terms', to: '/terms' },
  { kind: 'privacy', label: 'Privacy', to: '/privacy' },
  { kind: 'refund', label: 'Refunds', to: '/refund-policy' },
  { kind: 'contact', label: 'Contact', to: '/contact' },
]

export default function LegalPage({ kind }: { kind: LegalKind }): React.JSX.Element {
  const doc = DOCS[kind]

  useEffect(() => {
    document.title = `${doc.title} — hunhar.in`
    window.scrollTo(0, 0)
  }, [doc.title])

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0A1B37] font-manrope">
      <Navbar />
      <main className="flex-1 w-full p-3 sm:p-4 lg:p-5">
        <section className="rounded-3xl sm:rounded-[2rem] bg-[#F3EFE6] text-navy pt-28 pb-16 px-6 sm:px-10">
          <div className="max-w-3xl mx-auto">
            <nav className="flex flex-wrap gap-2 mb-8" aria-label="Legal pages">
              {LINKS.map((l) => (
                <Link
                  key={l.kind}
                  to={l.to}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-semibold no-underline border ${
                    l.kind === kind ? 'bg-[#08182B] text-white border-[#08182B]' : 'bg-white text-navy border-[#E3D8C8] hover:border-[#C06B3E]'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <h1 className="text-[2rem] sm:text-[2.5rem] font-extrabold leading-tight m-0">{doc.title}</h1>
            <p className="text-[13px] text-[#7A6E62] mt-2 mb-6">Last updated {UPDATED}</p>
            <p className="text-[16px] leading-7 text-[#3E352C]">{doc.intro}</p>
            {doc.sections.map((s) => (
              <div key={s.heading} className="mt-8">
                <h2 className="text-[1.2rem] font-bold m-0 mb-3">{s.heading}</h2>
                {s.body.map((b, i) => (
                  <p key={i} className="text-[15px] leading-7 text-[#3E352C] my-2 [&_a]:text-[#C06B3E] [&_a]:font-semibold">
                    {b}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
