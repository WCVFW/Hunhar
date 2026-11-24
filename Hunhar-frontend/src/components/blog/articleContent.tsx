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

    // Headings in Makira font (supports ### H3, ## H2, # H1, and uppercase HTML-like tags)
    const h3Match = line.match(/^###\s+(.*)$/i) || line.match(/^<h3[^>]*>(.*?)<\/h3>$/i);
    if (h3Match) {
      flushList();
      elements.push(
        <h3 key={i} className="text-xl sm:text-2xl font-medium text-navy mt-8 mb-3 font-makira uppercase tracking-wide">
          {h3Match[1].trim()}
        </h3>
      );
      continue;
    }

    const h2Match = line.match(/^##\s+(.*)$/i) || line.match(/^<h2[^>]*>(.*?)<\/h2>$/i);
    if (h2Match) {
      flushList();
      elements.push(
        <h2 key={i} className="text-2xl sm:text-3xl font-medium text-navy mt-10 mb-4 font-makira uppercase tracking-wide">
          {h2Match[1].trim()}
        </h2>
      );
      continue;
    }

    const h1Match = line.match(/^#\s+(.*)$/i) || line.match(/^<h1[^>]*>(.*?)<\/h1>$/i);
    if (h1Match) {
      flushList();
      elements.push(
        <h2 key={i} className="text-2xl sm:text-3xl font-medium text-navy mt-10 mb-4 font-makira uppercase tracking-wide">
          {h1Match[1].trim()}
        </h2>
      );
      continue;
    }

    // Markdown Table: lines starting and containing |
    if (line.includes('|')) {
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().includes('|')) {
        tableLines.push(lines[j].trim());
        j++;
      }

      if (tableLines.length >= 2) {
        flushList();
        i = j - 1; // Advance main loop

        // Parse header and rows
        const parseRow = (rowStr: string) =>
          rowStr
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim());

        const headerCells = parseRow(tableLines[0]);
        // Row 1 might be divider |---|---|
        const isDivider = (s: string) => /^[:\s-–—|]+$/.test(s);
        const dataRows = tableLines.slice(1).filter((r) => !isDivider(r));

        elements.push(
          <div key={`table-${i}`} className="my-8 w-full overflow-x-auto rounded-[18px] border border-[#DECFBE] bg-white shadow-xs">
            <table className="w-full min-w-[500px] border-collapse text-left font-manrope text-sm">
              <thead>
                <tr className="border-b border-[#DECFBE] bg-[#FAF4EE]">
                  {headerCells.map((cell, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-3 font-makira text-[13px] font-medium uppercase tracking-wider text-[#08182B]"
                      dangerouslySetInnerHTML={{ __html: parseInline(cell) }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2E8DC]">
                {dataRows.map((rowStr, rIdx) => {
                  const cells = parseRow(rowStr);
                  return (
                    <tr key={rIdx} className="transition-colors hover:bg-[#FAF7F2]">
                      {cells.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-3 text-[13.5px] leading-relaxed text-[#334155]"
                          dangerouslySetInnerHTML={{ __html: parseInline(cell) }}
                        />
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
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
