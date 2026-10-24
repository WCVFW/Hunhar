import React from 'react'

interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="rounded-[24px] border border-[#E8DFD3] bg-white p-8 sm:p-10 shadow-sm">
        <h1 className="m-0 font-makira text-2xl sm:text-3xl font-bold text-[#08182B] tracking-tight">
          {title}
        </h1>
        <p className="mt-3 font-manrope text-sm sm:text-base text-[#64748B]">
          Coming soon
        </p>
      </div>
    </div>
  )
}
