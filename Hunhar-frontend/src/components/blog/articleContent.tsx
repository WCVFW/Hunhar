import React from 'react'
import { fileUrl } from '../../services/api'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Only http(s), site-relative and mailto links (images: http(s) and uploaded files). Returns '' when unsafe. */
function safeUrl(raw: string, image = false): string {
  const u = (raw || '').trim().replace(/&amp;/g, '&')
  if (/^\/api\/v1\/projects\/files\/[0-9a-fA-F-]{36}$/.test(u)) return fileUrl(u)
  if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u.replace(/"/g, '%22')
  if (!image && (/^\/[^\s"'<>]*$/.test(u) || /^#[\w-]*$/.test(u) || /^mailto:[^\s"'<>]+$/i.test(u))) return u
  return ''
}

// Convert markdown to clean rendered HTML elements
export function renderArticleContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (inList === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-5 pl-6 list-disc space-y-2 text-slate-700 font-manrope">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-5 pl-6 list-decimal space-y-2 text-slate-700 font-manrope">
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ol>
        );
      }
      inList = null;
      listItems = [];
    }
  };

  // Articles come from the blog dashboard: escape all HTML first, then allow bold and safe links (no italics)
  const parseInline = (text: string) => {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, (_m, label: string, href: string) => {
        const url = safeUrl(href);
        if (!url) return label;
        const external = /^https?:/i.test(url);
        return `<span class="relative inline-block group"><a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} title="${url}" class="text-terracotta underline font-medium hover:text-[#AA572D] transition-colors cursor-pointer">${label}</a><span class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-normal text-white bg-[#0A1B37] rounded-lg shadow-xl z-50 whitespace-nowrap"><span class="text-terracotta">🔗</span> ${url}</span></span>`;
      });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Headings in Makira font
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-xl sm:text-2xl font-medium text-navy mt-8 mb-3 font-makira uppercase tracking-wide">
          {line.replace('### ', '')}
        </h3>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-2xl sm:text-3xl font-medium text-navy mt-10 mb-4 font-makira uppercase tracking-wide">
          {line.replace('## ', '')}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      const quoteText = line.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={i}
          className="border-l-4 border-terracotta bg-[#FFF8F3] p-5 my-6 rounded-r-xl not-italic font-normal text-slate-800 font-manrope"
          dangerouslySetInnerHTML={{ __html: parseInline(quoteText) }}
        />
      );
      continue;
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listItems.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Ordered list
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listItems.push(orderedMatch[1]);
      continue;
    }

    // Image markdown: ![alt](url)
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushList();
      elements.push(
        <div key={i} className="my-8 rounded-2xl overflow-hidden shadow-lg border border-black/5">
          {safeUrl(imgMatch[2], true) && (
            <img src={safeUrl(imgMatch[2], true)} alt={imgMatch[1]} className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
          )}
          {imgMatch[1] && (
            <p className="text-center text-xs text-slate-500 py-2 bg-slate-50 border-t border-black/5 font-manrope">
              {imgMatch[1]}
            </p>
          )}
        </div>
      );
      continue;
    }

    // Normal paragraph in Manrope
    flushList();
    elements.push(
      <p
        key={i}
        className="text-base sm:text-lg text-slate-700 leading-relaxed my-4 font-manrope"
        dangerouslySetInnerHTML={{ __html: parseInline(line) }}
      />
    );
  }

  flushList();
  return elements;
}
