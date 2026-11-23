import type { BlogFaqItem } from '../types/blog';

const FAQS_COMMENT_REGEX = /<!--\s*FAQS_DATA:\s*([\s\S]*?)\s*-->/;

/**
 * Extracts FAQ items embedded within article content comments (or falls back to post.faqs).
 * Strips the hidden FAQ marker from the content for clean markdown rendering.
 */
export function extractFaqs(
  rawContent: string,
  existingFaqs?: BlogFaqItem[]
): { cleanContent: string; faqs: BlogFaqItem[] } {
  if (!rawContent) {
    return { cleanContent: '', faqs: existingFaqs || [] };
  }

  const match = rawContent.match(FAQS_COMMENT_REGEX);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        const cleanContent = rawContent.replace(FAQS_COMMENT_REGEX, '').trim();
        const validFaqs = parsed.filter(
          (item: any) =>
            item &&
            typeof item === 'object' &&
            (typeof item.question === 'string' || typeof item.answer === 'string')
        );
        return { cleanContent, faqs: validFaqs };
      }
    } catch (err) {
      console.warn('Failed to parse embedded FAQS_DATA JSON:', err);
    }
  }

  return {
    cleanContent: rawContent.replace(FAQS_COMMENT_REGEX, '').trim(),
    faqs: existingFaqs || [],
  };
}

/**
 * Embeds FAQ items at the end of the markdown content inside an HTML comment.
 * This guarantees persistence in the existing backend with zero DB schema changes.
 */
export function embedFaqs(content: string, faqs: BlogFaqItem[]): string {
  const stripped = (content || '').replace(FAQS_COMMENT_REGEX, '').trim();
  const validFaqs = (faqs || []).filter(
    (f) => (f.question && f.question.trim()) || (f.answer && f.answer.trim())
  );

  if (validFaqs.length === 0) {
    return stripped;
  }

  const jsonPayload = JSON.stringify(validFaqs);
  return `${stripped}\n\n<!-- FAQS_DATA: ${jsonPayload} -->`;
}

/**
 * Builds schema.org/FAQPage JSON-LD structured data for Google rich search results.
 */
export function buildFaqSchema(faqs: BlogFaqItem[]): Record<string, any> | null {
  const validFaqs = (faqs || []).filter(
    (f) => f.question && f.question.trim() && f.answer && f.answer.trim()
  );

  if (validFaqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validFaqs.map((f) => ({
      '@type': 'Question',
      name: f.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer.trim(),
      },
    })),
  };
}
