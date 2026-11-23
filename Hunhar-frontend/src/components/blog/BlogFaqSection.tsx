import React, { useState } from 'react';
import type { BlogFaqItem } from '../../types/blog';
import { ChevronDown } from 'lucide-react';

interface BlogFaqSectionProps {
  faqs?: BlogFaqItem[];
  title?: string;
  className?: string;
}

export default function BlogFaqSection({
  faqs,
  title = 'Frequently Asked Questions',
  className = '',
}: BlogFaqSectionProps): React.JSX.Element | null {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={`w-full my-12 sm:my-14 ${className}`} aria-label="Frequently Asked Questions">
      {/* Title */}
      <h2 className="font-makira text-2xl sm:text-3xl lg:text-4xl uppercase font-medium text-navy text-center tracking-tight mb-8 sm:mb-10">
        {title}
      </h2>

      {/* FAQ Accordion List */}
      <div className="space-y-3.5 sm:space-y-4 max-w-3xl mx-auto">
        {faqs.map((item, index) => {
          const isOpen = openIndex === index;
          const questionText = item.question?.trim() || `Question ${index + 1}`;
          const answerText = item.answer?.trim() || '';

          return (
            <div
              key={index}
              className="rounded-2xl bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white shadow-md transition-all duration-300 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleIndex(index)}
                className="w-full text-left px-6 py-4.5 sm:py-5 flex items-center justify-between gap-4 font-manrope font-bold text-base sm:text-[17px] text-white hover:brightness-105 transition-all cursor-pointer select-none"
                aria-expanded={isOpen}
              >
                <span className="flex-1 leading-snug">{questionText}</span>
                <span
                  className={`w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 transition-transform duration-300 ease-in-out ${
                    isOpen ? 'rotate-180 bg-white/30' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </span>
              </button>

              {/* Smooth Collapsible Container */}
              <div
                className={`grid transition-all duration-300 sm:duration-400 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-5 pt-1 font-manrope text-sm sm:text-base leading-relaxed border-t border-white/20">
                    <div className="bg-white rounded-xl p-5 mt-2 text-navy shadow-sm">
                      {answerText ? (
                        <p className="whitespace-pre-line text-slate-800 leading-relaxed font-manrope">{answerText}</p>
                      ) : (
                        <p className="italic text-slate-500">No answer provided yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
