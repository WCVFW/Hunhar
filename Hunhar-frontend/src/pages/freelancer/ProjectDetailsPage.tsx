import React from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Briefcase,
  Clock,
  Star,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import cardDeskMascot from '../../assets/Job_details_image.png'

export default function ProjectDetailsPage(): React.JSX.Element {
  const { projectId = '1' } = useParams<{ projectId: string }>()

  // Mock project detail data matching user Figma design
  const project = {
    id: projectId,
    category: 'MOTION DESIGN',
    status: 'Bid Open',
    title: 'Motion Graphics Package',
    client: 'Aeris Creative',
    postedTime: 'Posted 2h ago',
    rating: 4.8,
    reviewsCount: 12,
    description:
      'We are looking for an experienced motion designer to create a full motion graphics package for our upcoming product launch campaign.',
    skills: ['After Effects', 'Motion Design', 'Premiere Pro'],
    paymentPhases: [
      { id: 1, title: 'Phase 1: Not yet started' },
      { id: 2, title: 'Phase 2: Not yet started' },
      { id: 3, title: 'Phase 3: Not yet started' },
    ],
    // Right sidebar details
    bidCost: '20 Credits',
    budget: '₹1,800 – ₹2,400',
    timeline: '3 weeks',
    categoryName: 'Motion Design',
    bidsCount: '4 bids',
    clientInitial: 'A',
    clientVerified: true,
    clientMemberSince: 'Member since 2024',
  }

  return (
    <div className="flex w-full flex-col gap-5 pb-12 font-manrope">
      {/* 1. TOP HEADER TITLE */}
      <div className="flex items-center gap-2 text-[#08182B]">
        <Briefcase size={20} className="text-[#8E8376]" />
        <h1 className="font-manrope text-[18px] sm:text-[20px] font-bold text-[#08182B]">
          Project Overview
        </h1>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: Left (Content) & Right (Bid & Client Cards) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Main Overview, Required Skills, and Payments (lg:col-span-8) */}
        <div className="flex flex-col gap-5 lg:col-span-8">
          {/* Main Card: Image, Title, Description */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
            {/* Category Pill and Status Indicator */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DACD] bg-[#FBF8F3] px-3.5 py-1 font-manrope text-[11px] font-bold tracking-wide text-[#9C5128]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C06B3E]" />
                {project.category}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full font-manrope text-[12px] font-bold text-[#1F874C]">
                <span className="h-2 w-2 rounded-full bg-[#1F874C]" />
                {project.status}
              </span>
            </div>

            {/* Mascot / Project Desk Image Banner */}
            <div className="relative mt-4 h-[240px] sm:h-[300px] w-full overflow-hidden rounded-[20px] bg-[#E8DDD0]">
              <img
                src={cardDeskMascot}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Title */}
            <h2 className="mt-5 font-manrope text-[22px] sm:text-[24px] font-extrabold text-[#08182B]">
              {project.title}
            </h2>

            {/* Client, Time, Rating Metadata */}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-[#73685C]">
              <span className="font-semibold text-[#544B40] flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-[#EFE5DB] text-[#C06B3E] flex items-center justify-center text-[10px] font-bold">
                  👤
                </span>
                {project.client}
              </span>

              <span className="flex items-center gap-1.5 text-[#8E8376]">
                <Clock size={14} />
                {project.postedTime}
              </span>

              <span className="flex items-center gap-1 font-semibold text-[#8E8376]">
                <Star size={14} className="fill-[#EAA43A] text-[#EAA43A]" />
                <span className="text-[#332B24]">{project.rating}</span>
                <span>({project.reviewsCount} reviews)</span>
              </span>
            </div>

            {/* Description Paragraph */}
            <p className="mt-4 font-manrope text-[14px] leading-relaxed text-[#594E42]">
              {project.description}
            </p>
          </div>

          {/* Required Skills Card */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Required Skills
            </h3>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {project.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-[10px] bg-[#F5ECE1] px-4 py-2 font-manrope text-[13px] font-medium text-[#544A3D]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Project payments Card */}
          <div className="w-full rounded-[24px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="font-manrope text-[16px] font-bold text-[#08182B]">
              Project payments
            </h3>

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              {project.paymentPhases.map((phase) => (
                <div
                  key={phase.id}
                  className="rounded-[10px] bg-[#F5ECE1]/80 px-4 py-2 font-manrope text-[13px] font-medium text-[#544A3D]"
                >
                  {phase.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Submit Bid Action, Project Details, About Client (lg:col-span-4) */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Submit Bid Button (Terracotta solid pill/card) */}
          <Link
            to={`/freelancer/browse/${project.id}/bid`}
            className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#C06B3E] font-manrope text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(192,107,62,0.35)] transition-all hover:bg-[#AA572D] hover:shadow-[0_6px_18px_rgba(192,107,62,0.45)] active:scale-98"
          >
            Submit Bid • {project.bidCost}
          </Link>

          {/* Project Details Box */}
          <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs">
            <h3 className="font-manrope text-[13px] font-bold uppercase tracking-wider text-[#8A7F73]">
              PROJECT DETAILS
            </h3>

            <div className="mt-4 flex flex-col gap-3.5">
              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Budget</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {project.budget}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Timeline</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {project.timeline}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Category</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {project.categoryName}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <span className="text-[#8E8376]">Bids so far</span>
                <span className="font-manrope font-bold text-[#08182B]">
                  {project.bidsCount}
                </span>
              </div>
            </div>
          </div>

          {/* About Client Box */}
          <div className="w-full rounded-[20px] border border-[#E5E5E5] bg-white p-5 shadow-xs">
            <h3 className="font-manrope text-[14px] font-bold text-[#08182B]">
              About {project.client}
            </h3>

            {/* Client Avatar + Rating */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5249DE] font-manrope text-[16px] font-bold text-white shadow-xs">
                {project.clientInitial}
              </div>

              <div>
                <h4 className="font-manrope text-[15px] font-bold text-[#08182B]">
                  {project.client}
                </h4>
                <div className="flex items-center gap-1 text-[12px] text-[#786D61]">
                  <Star size={13} className="fill-[#EAA43A] text-[#EAA43A]" />
                  <span className="font-semibold text-[#2D241C]">{project.rating}</span>
                  <span>• {project.reviewsCount} reviews</span>
                </div>
              </div>
            </div>

            {/* Verification & Member Info */}
            <p className="mt-3.5 text-[12px] text-[#7A7065]">
              Verified client • {project.clientMemberSince}
            </p>

            {/* View Details Button */}
            <button
              type="button"
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#E0D5C7] bg-white font-manrope text-[13px] font-bold text-[#2E251B] transition-colors hover:bg-[#FAF7F2]"
            >
              <Eye size={15} />
              <span>View Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
