import React, { useState, useEffect, useRef } from 'react';
import type { BlogPost, BlogPostInput, BlogFaqItem } from '../types/blog';
import {
  PenSquare,
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Link as LinkIcon,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  X,
  Table as TableIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { blogApi, fileUrl, filesApi, getSessionRole, tokenStorage } from '../services/api';
import { renderArticleContent } from '../components/blog/articleContent';
import BlogFaqSection from '../components/blog/BlogFaqSection';
import { extractFaqs, embedFaqs } from '../services/blogFaq';
import { invalidateBlogCache } from '../services/blogPosts';

function markdownToHtml(md: string): string {
  const lines = (md || '').split('\n');
  const out: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList) {
      out.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      out.push('<table class="w-full my-4 border-collapse border border-[#DECFBE] rounded-xl overflow-hidden"><tbody>');
      tableRows.forEach((r, idx) => {
        const isHeader = idx === 0;
        const tag = isHeader ? 'th' : 'td';
        const cls = isHeader
          ? 'border border-[#DECFBE] bg-[#FAF4EE] px-3.5 py-2.5 font-makira text-left font-medium uppercase text-[#08182B]'
          : 'border border-[#DECFBE] px-3.5 py-2 text-slate-700 font-manrope';
        out.push('<tr>' + r.map((c) => `<${tag} class="${cls}">${c || '&nbsp;'}</${tag}>`).join('') + '</tr>');
      });
      out.push('</tbody></table>');
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    if (line.includes('|')) {
      flushList();
      if (!inTable) inTable = true;
      if (!/^[:\s-–—|]+$/.test(line)) {
        const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    if (/^###\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^###\s+/, '');
      out.push(`<h3 class="text-xl sm:text-2xl font-medium text-navy font-makira uppercase tracking-wide my-4">${txt}</h3>`);
      continue;
    }

    if (/^##\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^##\s+/, '');
      out.push(`<h2 class="text-2xl sm:text-3xl font-medium text-navy font-makira uppercase tracking-wide my-5">${txt}</h2>`);
      continue;
    }

    if (/^#\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^#\s+/, '');
      out.push(`<h2 class="text-2xl sm:text-3xl font-medium text-navy font-makira uppercase tracking-wide my-5">${txt}</h2>`);
      continue;
    }

    if (/^>\s+/.test(line)) {
      flushList();
      const txt = line.replace(/^>\s+/, '');
      out.push(`<blockquote class="border-l-4 border-terracotta bg-[#FFF8F3] p-4 my-4 rounded-r-xl font-manrope text-slate-800">${txt}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
        out.push('<ul class="my-4 pl-6 list-disc space-y-1.5 text-slate-700 font-manrope">');
      }
      out.push(`<li>${line.replace(/^[-*]\s+/, '')}</li>`);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
        out.push('<ol class="my-4 pl-6 list-decimal space-y-1.5 text-slate-700 font-manrope">');
      }
      out.push(`<li>${olMatch[1]}</li>`);
      continue;
    }

    flushList();
    out.push(`<p class="text-base text-slate-700 leading-relaxed my-3 font-manrope">${line}</p>`);
  }

  flushList();
  flushTable();
  return out.join('\n');
}

/** Converts rich HTML copied from Google Docs, Word, or web pages into clean Markdown */
function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const isBoldStyle = el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight, 10) >= 600;

    let childrenText = '';
    el.childNodes.forEach((child) => {
      childrenText += walk(child);
    });

    switch (tag) {
      case 'h1':
      case 'h2': {
        const clean = childrenText.trim();
        return clean ? `\n\n## ${clean}\n\n` : '';
      }
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const clean = childrenText.trim();
        return clean ? `\n\n### ${clean}\n\n` : '';
      }
      case 'p': {
        const clean = childrenText.trim();
        return clean ? `\n\n${clean}\n\n` : '';
      }
      case 'br':
        return '\n';
      case 'strong':
      case 'b': {
        const clean = childrenText.trim();
        return clean ? `**${clean}**` : '';
      }
      case 'a': {
        const href = el.getAttribute('href') || '';
        const clean = childrenText.trim();
        if (!href || !clean) return clean;
        return `[${clean}](${href})`;
      }
      case 'li': {
        const clean = childrenText.trim();
        if (!clean) return '';
        const parentTag = el.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          return `\n1. ${clean}`;
        }
        return `\n- ${clean}`;
      }
      case 'ul':
      case 'ol':
        return `\n${childrenText}\n`;
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (!rows.length) return '';
        const mdRows: string[] = [];
        let headerColsCount = 0;

        rows.forEach((tr, rIdx) => {
          const cells = Array.from(tr.querySelectorAll('th, td')).map((c) =>
            (c.textContent || '').replace(/\s+/g, ' ').replace(/\|/g, '-').trim()
          );
          if (cells.length > 0) {
            mdRows.push(`| ${cells.join(' | ')} |`);
            if (rIdx === 0) {
              headerColsCount = cells.length;
              const divider = cells.map(() => '---').join(' | ');
              mdRows.push(`| ${divider} |`);
            }
          }
        });
        return `\n\n${mdRows.join('\n')}\n\n`;
      }
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'tr':
      case 'td':
      case 'th':
        return childrenText;
      case 'blockquote': {
        const clean = childrenText.trim();
        return clean ? `\n\n> ${clean}\n\n` : '';
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'Image';
        return src ? `\n\n![${alt}](${src})\n\n` : '';
      }
      default: {
        if (isBoldStyle && childrenText.trim()) {
          return `**${childrenText.trim()}**`;
        }
        return childrenText;
      }
    }
  }

  const rawMd = walk(doc.body);
  return rawMd.replace(/\n{3,}/g, '\n\n').trim();
}

const CATEGORIES = [
  'Freelancing Tips',
  'Hiring & Talent',
  'Student Success',
  'Design & Tech',
  'Business Growth',
];

const DEFAULT_AUTHORS = [
  {
    name: 'Hunhar',
    role: 'SEO Team',
    avatar: '/Hunhar_Blog_profile.png',
  },
];

export default function BlogAdminPage(): React.JSX.Element {
  const navigate = useNavigate();
  const role = getSessionRole();
  const editor = tokenStorage.getUser();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Mode: 'list' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');

  // Active form data for creating/editing
  const [formData, setFormData] = useState<BlogPostInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    category: 'Freelancing Tips',
    tags: [],
    author: DEFAULT_AUTHORS[0],
    status: 'published',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    featured: false,
  });

  const [tagsInput, setTagsInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Freelancing Tips');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview' | 'split'>('write');
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<boolean>(false);
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkText, setLinkText] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [faqs, setFaqs] = useState<BlogFaqItem[]>([]);
  const [activeTag, setActiveTag] = useState<'h2' | 'h3' | 'blockquote' | 'ul' | 'ol' | 'table' | 'p'>('p');

  // Table Builder State (supports live adding/removing rows and columns)
  const [tableModalOpen, setTableModalOpen] = useState<boolean>(false);
  const [tableHeaders, setTableHeaders] = useState<string[]>(['Heading 1', 'Heading 2']);
  const [tableRowsData, setTableRowsData] = useState<string[][]>([['Content 1', 'Content 2']]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const lastSavedRangeRef = useRef<Range | null>(null);
  const lastTextareaCursorRef = useRef<{ start: number; end: number } | null>(null);

  // Close status dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch posts on mount
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setPosts(await blogApi.adminPosts());
    } catch (err) {
      console.error('Error loading posts:', err);
      showNotification('error', 'Failed to load posts from server.');
    } finally {
      setLoading(false);
    }
  };

  // Only blog editors (and admins) can use this dashboard
  useEffect(() => {
    if (role !== 'EDITOR' && role !== 'ADMIN') {
      navigate('/blog-admin/login', { replace: true });
      return;
    }
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Start new post
  const handleNewPost = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '## Introduction\n\nWrite your introduction here...\n\n### Key Takeaways\n\n- Point 1\n- Point 2\n\n> Pro-tip: Insert useful tips or quotes here!',
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      category: 'Freelancing Tips',
      tags: ['Freelance', 'Hunhar'],
      author: DEFAULT_AUTHORS[0],
      status: 'published',
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      featured: false,
    });
    setSelectedCategory('Freelancing Tips');
    setCustomCategory('');
    setSlugManuallyEdited(false);
    setTagsInput('Freelance, Hunhar');
    setUploadedImageUrl('');
    setFaqs([]);
    setViewMode('edit');
  };

  // Start editing existing post
  const handleEditPost = (post: BlogPost) => {
    const { cleanContent, faqs: extractedFaqs } = extractFaqs(post.content, post.faqs);
    setFormData({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: cleanContent,
      coverImage: post.coverImage,
      category: post.category,
      tags: post.tags,
      author: post.author,
      status: post.status,
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      focusKeyword: post.focusKeyword || '',
      featured: post.featured || false,
      publishedAt: post.publishedAt,
    });
    setFaqs(extractedFaqs);
    const isStandard = CATEGORIES.includes(post.category);
    if (isStandard) {
      setSelectedCategory(post.category);
      setCustomCategory('');
    } else {
      setSelectedCategory('Others');
      setCustomCategory(post.category || '');
    }
    setSlugManuallyEdited(true);
    setTagsInput(post.tags.join(', '));
    setUploadedImageUrl('');
    setViewMode('edit');
  };

  // Handle Cover Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = true) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setUploadingImage(true);
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please choose an image file (JPG, PNG, WebP).');
        return;
      }
      const stored = await filesApi.upload(file);
      if (isCover) {
        setFormData((prev) => ({ ...prev, coverImage: stored.url }));
        showNotification('success', 'Cover image uploaded successfully!');
      } else {
        setUploadedImageUrl(stored.url);
        showNotification('success', 'Image uploaded! Click "Insert into Article" to place it.');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showNotification('error', err?.message || 'Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Insert image markdown into content
  const handleInsertImageIntoContent = (url: string) => {
    const markdownImg = `\n\n![Image description](${url})\n\n`;
    setFormData((prev) => ({
      ...prev,
      content: (prev.content || '') + markdownImg,
    }));
    showNotification('success', 'Image inserted into article!');
  };

  // Save Post
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showNotification('error', 'Please fill in both the Title and Content.');
      return;
    }

    try {
      setSaving(true);
      const processedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const finalCategory =
        selectedCategory === 'Others'
          ? (customCategory.trim() || 'Others')
          : (formData.category || selectedCategory || 'Freelancing Tips');

      const baseTitle = (formData.title || '').replace(/\s*\|\s*Hunhar Blog/gi, '').trim();
      const rawMetaTitle = (formData.metaTitle || '').replace(/\s*\|\s*Hunhar Blog/gi, '').trim();
      const finalMetaTitle = rawMetaTitle ? `${rawMetaTitle} | Hunhar Blog` : `${baseTitle} | Hunhar Blog`;
      const cleanSlug = (formData.slug || formData.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')).trim();
      const finalContent = embedFaqs(formData.content, faqs);

      const payload = {
        ...formData,
        content: finalContent,
        faqs,
        slug: cleanSlug,
        category: finalCategory,
        tags: processedTags,
        metaTitle: finalMetaTitle,
        metaDescription: formData.metaDescription || formData.excerpt,
      };

      await blogApi.save(payload);
      invalidateBlogCache();
      showNotification('success', 'Article saved successfully!');
      await fetchPosts();
      setViewMode('list');
    } catch (err: any) {
      console.error('Save error:', err);
      showNotification('error', err?.message || 'Network error while saving post.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (id: string) => {
    try {
      await blogApi.remove(id);
      invalidateBlogCache();
      showNotification('success', 'Article deleted.');
      setDeleteConfirmId(null);
      await fetchPosts();
    } catch (err: any) {
      console.error('Delete error:', err);
      showNotification('error', err?.message || 'Error deleting post.');
    }
  };

  // FAQ management helpers
  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Visual Editor Selection and Cursor Helpers
  const saveVisualSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && visualEditorRef.current) {
      const range = sel.getRangeAt(0);
      if (visualEditorRef.current.contains(range.commonAncestorContainer)) {
        lastSavedRangeRef.current = range.cloneRange();
      }
    }
  };

  const saveTextareaCursor = () => {
    if (contentTextareaRef.current) {
      lastTextareaCursorRef.current = {
        start: contentTextareaRef.current.selectionStart || 0,
        end: contentTextareaRef.current.selectionEnd || 0,
      };
    }
  };

  // Visual Editor Sync & Commands
  const handleVisualInput = () => {
    if (!visualEditorRef.current) return;
    const html = visualEditorRef.current.innerHTML;
    const md = htmlToMarkdown(html);
    setFormData((prev) => ({ ...prev, content: md }));
    updateActiveTagVisual();
  };

  const updateActiveTagVisual = () => {
    saveVisualSelection();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !visualEditorRef.current) return;
    let node: Node | null = sel.anchorNode;
    let foundTag: typeof activeTag = 'p';

    while (node && node !== visualEditorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'h2') {
          foundTag = 'h2';
          break;
        } else if (tag === 'h3') {
          foundTag = 'h3';
        } else if (tag === 'blockquote') {
          foundTag = 'blockquote';
        } else if (tag === 'ul') {
          foundTag = 'ul';
        } else if (tag === 'ol') {
          foundTag = 'ol';
        } else if (tag === 'table' || tag === 'tr' || tag === 'td' || tag === 'th') {
          foundTag = 'table';
          break;
        }
      }
      node = node.parentNode;
    }
    setActiveTag(foundTag);
  };

  const execVisualBlock = (tag: 'h2' | 'h3' | 'blockquote' | 'p' | 'ul' | 'ol') => {
    if (editorMode === 'markdown') {
      toggleBlockTag(tag as any);
      return;
    }

    if (!visualEditorRef.current) return;
    visualEditorRef.current.focus();

    if (tag === 'ul') {
      document.execCommand('insertUnorderedList', false);
    } else if (tag === 'ol') {
      document.execCommand('insertOrderedList', false);
    } else if (tag === 'h2') {
      const isAlreadyH2 = activeTag === 'h2';
      document.execCommand('formatBlock', false, isAlreadyH2 ? '<p>' : '<h2>');
    } else if (tag === 'h3') {
      const isAlreadyH3 = activeTag === 'h3';
      document.execCommand('formatBlock', false, isAlreadyH3 ? '<p>' : '<h3>');
    } else if (tag === 'blockquote') {
      const isAlreadyQuote = activeTag === 'blockquote';
      document.execCommand('formatBlock', false, isAlreadyQuote ? '<p>' : '<blockquote>');
    }

    handleVisualInput();
  };

  const execVisualInline = (command: 'bold' | 'italic') => {
    if (editorMode === 'markdown') {
      insertFormatting(command === 'bold' ? '**' : '*', command === 'bold' ? '**' : '*');
      return;
    }
    if (!visualEditorRef.current) return;
    visualEditorRef.current.focus();
    document.execCommand(command, false);
    handleVisualInput();
  };

  const handleOpenTableModal = () => {
    if (editorMode === 'visual') {
      saveVisualSelection();
    } else {
      saveTextareaCursor();
    }
    if (!tableHeaders || tableHeaders.length === 0) {
      setTableHeaders(['Heading 1', 'Heading 2']);
      setTableRowsData([['Content 1', 'Content 2']]);
    }
    setTableModalOpen(true);
  };

  const handleAddColumn = (afterIndex?: number) => {
    const colNum = tableHeaders.length + 1;
    const newHeader = `Heading ${colNum}`;
    if (typeof afterIndex === 'number') {
      const nextHeaders = [...tableHeaders];
      nextHeaders.splice(afterIndex + 1, 0, newHeader);
      setTableHeaders(nextHeaders);
      setTableRowsData((prev) =>
        prev.map((row) => {
          const nextRow = [...row];
          nextRow.splice(afterIndex + 1, 0, `Content ${colNum}`);
          return nextRow;
        })
      );
    } else {
      setTableHeaders((prev) => [...prev, newHeader]);
      setTableRowsData((prev) => prev.map((row) => [...row, `Content ${colNum}`]));
    }
  };

  const handleAddColumnLeft = () => {
    const colNum = 1;
    setTableHeaders((prev) => [`Heading ${prev.length + 1}`, ...prev]);
    setTableRowsData((prev) => prev.map((row) => [`Content ${row.length + 1}`, ...row]));
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (tableHeaders.length <= 1) {
      showNotification('error', 'Table must have at least one column.');
      return;
    }
    setTableHeaders((prev) => prev.filter((_, i) => i !== colIdx));
    setTableRowsData((prev) => prev.map((row) => row.filter((_, i) => i !== colIdx)));
  };

  const handleAddRow = (afterIndex?: number) => {
    const rowNum = tableRowsData.length + 1;
    const newRow = tableHeaders.map((_, i) => `Content ${rowNum}.${i + 1}`);
    if (typeof afterIndex === 'number') {
      const nextRows = [...tableRowsData];
      nextRows.splice(afterIndex + 1, 0, newRow);
      setTableRowsData(nextRows);
    } else {
      setTableRowsData((prev) => [...prev, newRow]);
    }
  };

  const handleAddRowTop = () => {
    const newRow = tableHeaders.map((_, i) => `Content 1.${i + 1}`);
    setTableRowsData((prev) => [newRow, ...prev]);
  };

  const handleRemoveRow = (rowIdx: number) => {
    if (tableRowsData.length <= 1) {
      showNotification('error', 'Table must have at least one content row.');
      return;
    }
    setTableRowsData((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  const handleHeaderChange = (colIdx: number, val: string) => {
    setTableHeaders((prev) => prev.map((h, i) => (i === colIdx ? val : h)));
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    setTableRowsData((prev) =>
      prev.map((row, rI) =>
        rI === rowIdx ? row.map((cell, cI) => (cI === colIdx ? val : cell)) : row
      )
    );
  };

  const handleInsertBuiltTable = () => {
    const cleanHeaders = tableHeaders.map((h) => h.trim() || 'Column');
    const cleanRows = tableRowsData.map((row) =>
      row.map((c) => c.trim() || '-')
    );

    if (editorMode === 'markdown') {
      const mdHeader = `| ${cleanHeaders.join(' | ')} |`;
      const mdDivider = `| ${cleanHeaders.map(() => '---').join(' | ')} |`;
      const mdRows = cleanRows.map((r) => `| ${r.join(' | ')} |`).join('\n');
      const fullMd = `\n\n${mdHeader}\n${mdDivider}\n${mdRows}\n\n`;

      const textarea = contentTextareaRef.current;
      if (textarea) {
        const start = lastTextareaCursorRef.current?.start ?? textarea.selectionStart ?? textarea.value.length;
        const end = lastTextareaCursorRef.current?.end ?? textarea.selectionEnd ?? textarea.value.length;
        const current = formData.content || '';
        const updated = current.substring(0, start) + fullMd + current.substring(end);
        setFormData((prev) => ({ ...prev, content: updated }));
        setTimeout(() => {
          textarea.focus();
          const nextPos = start + fullMd.length;
          textarea.selectionStart = nextPos;
          textarea.selectionEnd = nextPos;
        }, 0);
      } else {
        setFormData((prev) => ({
          ...prev,
          content: (prev.content || '') + fullMd,
        }));
      }
    } else {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
        const headerHtml = cleanHeaders
          .map(
            (h) =>
              `<th class="border border-[#DECFBE] bg-[#FAF4EE] px-3.5 py-2.5 font-makira text-left font-medium uppercase text-[#08182B]">${h}</th>`
          )
          .join('');
        const rowsHtml = cleanRows
          .map(
            (row) =>
              `<tr>${row
                .map(
                  (cell) =>
                    `<td class="border border-[#DECFBE] px-3.5 py-2 text-slate-700 font-manrope">${cell}</td>`
                )
                .join('')}</tr>`
          )
          .join('');

        const tableContainer = document.createElement('div');
        tableContainer.innerHTML = `
          <table class="w-full my-4 border-collapse border border-[#DECFBE] rounded-xl overflow-hidden">
            <thead>
              <tr>${headerHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <p><br></p>
        `.trim();

        const sel = window.getSelection();
        let inserted = false;

        if (
          lastSavedRangeRef.current &&
          visualEditorRef.current.contains(lastSavedRangeRef.current.commonAncestorContainer)
        ) {
          try {
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(lastSavedRangeRef.current);
            }
            lastSavedRangeRef.current.deleteContents();
            const frag = document.createDocumentFragment();
            while (tableContainer.firstChild) {
              frag.appendChild(tableContainer.firstChild);
            }
            lastSavedRangeRef.current.insertNode(frag);
            inserted = true;
          } catch (e) {
            console.warn('Range insert failed, falling back:', e);
          }
        }

        if (!inserted) {
          // If no saved range inside editor, append to the end
          const frag = document.createDocumentFragment();
          while (tableContainer.firstChild) {
            frag.appendChild(tableContainer.firstChild);
          }
          visualEditorRef.current.appendChild(frag);
        }

        handleVisualInput();
      }
    }

    setTableModalOpen(false);
  };

  // Sync visual editor innerHTML when switching to visual mode or when post is loaded
  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      const generatedHtml = markdownToHtml(formData.content || '');
      // Only set if content differs meaningfully to preserve cursor
      const currentMd = htmlToMarkdown(visualEditorRef.current.innerHTML);
      if (currentMd !== (formData.content || '').trim()) {
        visualEditorRef.current.innerHTML = generatedHtml || '<p><br></p>';
      }
    }
  }, [editorMode, formData.id]);

  // Detect what element/tag cursor is currently inside
  const updateActiveTag = () => {
    saveTextareaCursor();
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart || 0;
    const text = textarea.value;
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    let lineEnd = text.indexOf('\n', pos);
    if (lineEnd === -1) lineEnd = text.length;
    const line = text.substring(lineStart, lineEnd).trim();

    if (/^##\s+/.test(line)) {
      setActiveTag('h2');
    } else if (/^###\s+/.test(line)) {
      setActiveTag('h3');
    } else if (/^>\s+/.test(line)) {
      setActiveTag('blockquote');
    } else if (/^[-*]\s+/.test(line)) {
      setActiveTag('ul');
    } else if (/^\d+\.\s+/.test(line)) {
      setActiveTag('ol');
    } else if (line.includes('|')) {
      setActiveTag('table');
    } else {
      setActiveTag('p');
    }
  };

  // Toggle current line or selection between Heading 2 (##), Heading 3 (###), or normal paragraph
  const toggleBlockTag = (targetTag: 'h2' | 'h3' | 'blockquote' | 'ul' | 'ol') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const current = formData.content || '';

    // Find the full line(s) spanned by the selection
    const lineStart = current.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = current.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = current.length;

    const fullLine = current.substring(lineStart, lineEnd);
    // Strip existing markdown prefixes from the line
    const cleanText = fullLine.replace(/^(#{1,6}|>|[-*]|\d+\.)\s*/, '').trim();

    let newPrefix = '';
    if (targetTag === 'h2') {
      newPrefix = activeTag === 'h2' ? '' : '## ';
    } else if (targetTag === 'h3') {
      newPrefix = activeTag === 'h3' ? '' : '### ';
    } else if (targetTag === 'blockquote') {
      newPrefix = activeTag === 'blockquote' ? '' : '> ';
    } else if (targetTag === 'ul') {
      newPrefix = activeTag === 'ul' ? '' : '- ';
    } else if (targetTag === 'ol') {
      newPrefix = activeTag === 'ol' ? '' : '1. ';
    }

    const replacement = cleanText ? `${newPrefix}${cleanText}` : `${newPrefix}Heading`;
    const updated = current.substring(0, lineStart) + replacement + current.substring(lineEnd);
    setFormData((prev) => ({ ...prev, content: updated }));

    setTimeout(() => {
      textarea.focus();
      const newCursor = lineStart + replacement.length;
      textarea.selectionStart = newCursor;
      textarea.selectionEnd = newCursor;
      updateActiveTag();
    }, 0);
  };

  // Quick insertion helpers for editor (supports cursor position & selection wrapping)
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        content: (prev.content || '') + `\n\n${prefix}\n\n`,
      }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const current = formData.content || '';
    const selected = current.substring(start, end);
    const placeholder = selected || (prefix.includes('|') ? '' : 'Heading Text');
    const insertText = prefix.includes('|')
      ? `\n\n${prefix}\n\n`
      : `${prefix}${placeholder}${suffix}`;

    const updated = current.substring(0, start) + insertText + current.substring(end);
    setFormData((prev) => ({ ...prev, content: updated }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + placeholder.length;
    }, 0);
  };

  // Handle rich text paste from Google Docs, Word, or web
  const handleContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (!html) return;

    if (/<(h[1-6]|p|a|ul|ol|li|blockquote|strong|b|table|tr|td|th)[\s>]/i.test(html)) {
      e.preventDefault();
      const markdown = htmlToMarkdown(html);
      const textarea = e.currentTarget;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const current = formData.content || '';
      const updated = current.substring(0, start) + markdown + current.substring(end);

      setFormData((prev) => ({ ...prev, content: updated }));

      setTimeout(() => {
        if (contentTextareaRef.current) {
          const nextCursor = start + markdown.length;
          contentTextareaRef.current.selectionStart = nextCursor;
          contentTextareaRef.current.selectionEnd = nextCursor;
          contentTextareaRef.current.focus();
        }
      }, 0);

      showNotification('success', 'Rich text formatted from Google Docs into clean Markdown!');
    }
  };

  // Open Link Modal with selected text
  const handleOpenLinkModal = () => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const selected = textarea.value.substring(start, end).trim();
      setLinkText(selected);
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setLinkModalOpen(true);
  };

  // Insert Link from Modal
  const handleInsertLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!linkText.trim() || !linkUrl.trim()) {
      showNotification('error', 'Please enter both the Keyword/Text and the URL.');
      return;
    }

    const cleanUrl = linkUrl.trim().startsWith('http') || linkUrl.trim().startsWith('/')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    const mdLink = `[${linkText.trim()}](${cleanUrl})`;

    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const current = formData.content || '';
      const updated = current.substring(0, start) + mdLink + current.substring(end);
      setFormData((prev) => ({ ...prev, content: updated }));
      setTimeout(() => {
        textarea.focus();
        const pos = start + mdLink.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
      }, 0);
    } else {
      setFormData((prev) => ({ ...prev, content: (prev.content || '') + ' ' + mdLink }));
    }

    setLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
    showNotification('success', 'Link inserted!');
  };

  // Filtered posts for list
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#0A1B37] text-navy font-manrope selection:bg-terracotta selection:text-white overflow-x-clip select-text">
      <Navbar />
      <main className="flex-1 w-full">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Outer Navy Frame */}
      <div className="p-2 sm:p-4 lg:p-5 2xl:p-6 bg-[#0A1B37]">
        <div className="relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-[#FDFBF7] pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20">
          {/* Admin Header */}
          <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-black/[0.08]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta mb-1 font-manrope">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hunhar SEO &amp; Content Management System</span>
              </div>
              {/* Heading in Makira font */}
              <h1 className="text-2xl sm:text-3xl font-medium font-makira uppercase tracking-wide text-navy">
                SEO Writer Portal
              </h1>
              {/* Subheading in Manrope font */}
              <p className="text-xs sm:text-sm font-manrope text-slate-500 mt-1">
                Write, edit, upload images, and publish blog articles without writing code.
              </p>
              <p className="text-xs font-manrope text-slate-500 mt-1">
                Signed in as <span className="font-bold text-navy">{editor?.email || editor?.fullName || 'editor'}</span> ·{' '}
                <button
                  type="button"
                  onClick={() => {
                    tokenStorage.removeToken();
                    window.location.href = '/blog-admin/login';
                  }}
                  className="font-bold text-terracotta hover:underline bg-transparent border-none p-0 cursor-pointer">
                  Log out
                </button>
              </p>
            </div>

            <div className="flex items-center gap-3 font-manrope">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-black/10 hover:bg-slate-50 text-slate-700 text-xs font-semibold no-underline transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Public Blog</span>
              </Link>

              {viewMode === 'list' ? (
                <button
                  type="button"
                  onClick={handleNewPost}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 transition-all cursor-pointer font-manrope"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write New Article</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/10 hover:bg-slate-50 text-navy text-xs font-semibold cursor-pointer font-manrope"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to All Posts</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="max-w-7xl mx-auto px-6">
            {viewMode === 'list' ? (
              /* POSTS LIST VIEW */
              <div>
                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-black/[0.08] shadow-sm font-manrope">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === 'all'
                          ? 'bg-navy text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All ({posts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('published')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === 'published'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Published ({posts.filter((p) => p.status === 'published').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('draft')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === 'draft'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Drafts ({posts.filter((p) => p.status === 'draft').length})
                    </button>
                  </div>

                  <div className="relative min-w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-black/10 rounded-full focus:outline-none focus:border-terracotta text-navy font-manrope"
                    />
                  </div>
                </div>

                {/* Posts Table / Cards */}
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 gap-2 font-manrope">
                    <RefreshCw className="w-5 h-5 animate-spin text-terracotta" />
                    <span>Loading articles...</span>
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-terracotta/30 transition-all"
                      >
                        {/* Left: Thumbnail & Details */}
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src={fileUrl(post.coverImage) || post.coverImage}
                            alt={post.title}
                            className="w-20 h-20 rounded-xl object-cover bg-slate-100 border border-black/5 shrink-0"
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5 font-manrope">
                              <span className="text-[11px] font-bold text-terracotta bg-[#FFF2E8] px-2.5 py-0.5 rounded-full">
                                {post.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  post.status === 'published'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {post.status}
                              </span>
                              {post.featured && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                  Featured
                                </span>
                              )}
                            </div>

                            {/* Post Title Heading in Makira */}
                            <h3 className="font-makira font-medium text-base text-navy line-clamp-1 mb-1">
                              {post.title}
                            </h3>

                            {/* Subheading / Excerpt in Manrope */}
                            <p className="text-xs font-manrope text-slate-500 line-clamp-1 mb-2">
                              {post.excerpt}
                            </p>

                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-manrope">
                              <span>By Hunhar</span>
                              <span>•</span>
                              <span>{post.readTime}</span>
                              <span>•</span>
                              <span>
                                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-manrope">
                          <Link
                            to={`/blog/${post.slug}`}
                            target="_blank"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="View Article"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleEditPost(post)}
                            className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-[#152e59] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <PenSquare className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {deleteConfirmId === post.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeletePost(post.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(post.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                              title="Delete Post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl border border-black/[0.08] p-8 font-manrope">
                    <p className="text-base font-semibold text-navy mb-2">No articles found</p>
                    <p className="text-xs text-slate-500 mb-6">
                      Click the button below to write your first SEO blog post!
                    </p>
                    <button
                      type="button"
                      onClick={handleNewPost}
                      className="px-5 py-2.5 rounded-full bg-terracotta text-white font-semibold text-xs hover:bg-[#AA572D] transition-colors cursor-pointer font-manrope"
                    >
                      Write New Article
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* POST EDITOR VIEW */
              <form onSubmit={handleSavePost} noValidate className="space-y-8 font-manrope">
                {/* Header with Save CTA */}
                <div className="flex items-center justify-between pb-6 border-b border-black/10">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="p-2 rounded-xl bg-white border border-black/10 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      {/* Edit View Heading in Makira */}
                      <h2 className="text-xl font-medium font-makira uppercase tracking-wide text-navy">
                        {formData.id ? 'Edit Article' : 'Write New Article'}
                      </h2>
                      {/* Subheading in Manrope */}
                      <p className="text-xs font-manrope text-slate-500">
                        Draft, format, add images, and optimize for Google search.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-manrope">
                    {formData.slug && (
                      <a
                        href={`/blog/${formData.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/10 hover:bg-slate-50 text-slate-700 text-xs font-semibold no-underline transition-colors"
                        title="View published article in new tab"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Article</span>
                      </a>
                    )}

                    {/* Custom Status Dropdown */}
                    <div className="relative" ref={statusDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setStatusDropdownOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-black/15 bg-white text-navy text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-sm select-none"
                      >
                        {formData.status === 'published' ? (
                          <>
                            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse" />
                            </span>
                            <span className="text-emerald-700">Published</span>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            <span className="text-amber-700">Draft</span>
                          </>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {statusDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-black/10 shadow-lg py-1 z-30 font-manrope">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, status: 'published' }));
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                              formData.status === 'published' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700'
                            }`}
                          >
                            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 animate-pulse" />
                            </span>
                            <span>Published</span>
                            {formData.status === 'published' && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, status: 'draft' }));
                              setStatusDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                              formData.status === 'draft' ? 'bg-amber-50 text-amber-800' : 'text-slate-700'
                            }`}
                          >
                            <span className="inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            <span>Draft</span>
                            {formData.status === 'draft' && <Check className="w-3.5 h-3.5 ml-auto text-amber-600" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white text-xs sm:text-sm font-bold shadow-md hover:brightness-105 transition-all cursor-pointer flex items-center gap-2 font-manrope"
                    >
                      {saving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>{saving ? 'Saving...' : 'Save & Publish'}</span>
                    </button>
                  </div>
                </div>

                {/* 2-Column Editor Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Title & SEO Meta Title & Editable Slug */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2 font-manrope">
                          Article Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. How to Hire Skilled Student Freelancers in India"
                          value={formData.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              title: newTitle,
                              slug: slugManuallyEdited
                                ? prev.slug
                                : newTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
                            }));
                          }}
                          className="w-full px-4 py-3 text-lg font-bold text-navy border border-black/10 rounded-xl focus:outline-none focus:border-terracotta font-manrope"
                        />
                      </div>

                      {/* Meta Title for SEO */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5 font-manrope">
                          <label className="text-xs font-bold text-navy uppercase tracking-wider">
                            Meta Title (SEO)
                          </label>
                          <span
                            className={`text-[11px] font-semibold ${
                              (formData.metaTitle?.length || 0) > 60
                                ? 'text-amber-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {formData.metaTitle?.length || 0} / 60 chars (Recommended for Google)
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. How to Hire Skilled Student Freelancers in India | Hunhar Blog"
                          value={formData.metaTitle}
                          onChange={(e) =>
                            setFormData({ ...formData, metaTitle: e.target.value })
                          }
                          className="w-full px-4 py-2.5 text-sm text-navy border border-black/10 rounded-xl focus:outline-none focus:border-terracotta font-manrope"
                        />
                      </div>

                      {/* Editable URL Slug */}
                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5 font-manrope">
                          Article URL
                        </label>
                        <div className="flex items-center rounded-xl border border-black/10 bg-slate-50 overflow-hidden focus-within:border-terracotta focus-within:ring-1 focus-within:ring-terracotta font-manrope">
                          <span className="px-3.5 py-2.5 text-xs text-slate-500 font-mono select-none bg-slate-100 border-r border-black/10 shrink-0">
                            https://www.hunhar.in/blog/
                          </span>
                          <input
                            type="text"
                            placeholder="article-slug"
                            value={formData.slug}
                            onChange={(e) => {
                              setSlugManuallyEdited(true);
                              const cleanSlug = e.target.value
                                .toLowerCase()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/[\s_]+/g, '-');
                              setFormData((prev) => ({ ...prev, slug: cleanSlug }));
                            }}
                            className="flex-1 px-3.5 py-2.5 text-xs font-mono text-navy bg-transparent focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <div className="flex items-center justify-between mb-2 font-manrope">
                        <label className="text-xs font-bold text-navy uppercase tracking-wider">
                          Meta Description
                        </label>
                        <span
                          className={`text-[11px] font-semibold flex items-center gap-1 ${
                            (formData.excerpt?.length || 0) > 155
                              ? 'text-red-500 font-bold'
                              : (formData.excerpt?.length || 0) >= 120
                              ? 'text-emerald-600 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          <span>{formData.excerpt?.length || 0} / 155 chars</span>
                          <span>
                            {(formData.excerpt?.length || 0) > 155
                              ? '❌ Too long (>155 turns Detailed SEO red)'
                              : (formData.excerpt?.length || 0) >= 120
                              ? '✔ Optimal SEO (Detailed SEO Green)'
                              : '(Recommended 120-155 chars)'}
                          </span>
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Brief 1-2 sentence summary of what readers will learn in this post (optimal: 120-155 characters)."
                        value={formData.excerpt}
                        onChange={(e) =>
                          setFormData({ ...formData, excerpt: e.target.value })
                        }
                        className={`w-full px-4 py-2.5 text-sm text-navy border rounded-xl focus:outline-none font-manrope transition-colors ${
                          (formData.excerpt?.length || 0) > 155
                            ? 'border-red-300 focus:border-red-500 bg-red-50/20'
                            : 'border-black/10 focus:border-terracotta'
                        }`}
                      />
                      {(formData.excerpt?.length || 0) > 155 && (
                        <p className="mt-1.5 text-xs text-red-500 font-manrope">
                          Tip: Detailed SEO extension marks descriptions over 155 characters as red (❌). Shorten slightly to get a green tick (✔).
                        </p>
                      )}
                    </div>

                    {/* Content Editor */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.08] font-manrope">
                        <label className="text-xs font-bold text-navy uppercase tracking-wider">
                          Article Content *
                        </label>

                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-manrope">
                          <button
                            type="button"
                            onClick={() => {
                              setEditorMode('visual');
                              setEditorTab('write');
                            }}
                            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                              editorMode === 'visual' ? 'bg-terracotta text-white shadow-xs' : 'text-slate-600 hover:text-navy'
                            }`}
                          >
                            Visual Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode('markdown')}
                            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                              editorMode === 'markdown' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
                            }`}
                          >
                            Markdown
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditorMode('markdown');
                              setEditorTab('preview');
                            }}
                            className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                              editorTab === 'preview' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
                            }`}
                          >
                            Preview
                          </button>
                        </div>
                      </div>

                      {/* Formatting helper buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-black/5 text-xs text-slate-700 font-manrope">
                        <button
                          type="button"
                          onClick={() => execVisualBlock('h2')}
                          className={`px-2.5 py-1 rounded font-bold cursor-pointer font-makira transition-all ${
                            activeTag === 'h2'
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title={activeTag === 'h2' ? 'Active: Heading 2 (Click to remove)' : 'Apply Heading 2 (##)'}
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => execVisualBlock('h3')}
                          className={`px-2.5 py-1 rounded font-bold cursor-pointer font-makira transition-all ${
                            activeTag === 'h3'
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title={activeTag === 'h3' ? 'Active: Heading 3 (Click to remove)' : 'Apply Heading 3 (###)'}
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => execVisualInline('bold')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer"
                          title="Bold (**text**)"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => execVisualInline('italic')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded italic cursor-pointer"
                          title="Italic (*text*)"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => execVisualBlock('blockquote')}
                          className={`px-2 py-1 rounded cursor-pointer transition-all ${
                            activeTag === 'blockquote'
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Quote (> quote)"
                        >
                          &ldquo;Quote&rdquo;
                        </button>
                        <button
                          type="button"
                          onClick={() => execVisualBlock('ul')}
                          className={`px-2 py-1 rounded cursor-pointer transition-all ${
                            activeTag === 'ul'
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Bullet List (- item)"
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => execVisualBlock('ol')}
                          className={`px-2 py-1 rounded cursor-pointer transition-all ${
                            activeTag === 'ol'
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Numbered List (1. item)"
                        >
                          1. Numbered
                        </button>
                        <button
                          type="button"
                          onMouseDown={() => {
                            if (editorMode === 'visual') saveVisualSelection();
                            else saveTextareaCursor();
                          }}
                          onClick={handleOpenTableModal}
                          className={`px-2.5 py-1 rounded cursor-pointer font-bold text-xs transition-all ${
                            activeTag === 'table' || tableModalOpen
                              ? 'bg-terracotta text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Interactive Table Builder"
                        >
                          Table
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenLinkModal}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Link
                        </button>

                        {/* Current cursor block indicator */}
                        <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-500 font-manrope">
                          <span>Current:</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 font-bold uppercase text-navy">
                            {activeTag}
                          </span>
                        </div>
                      </div>

                      {/* Inline Image Uploader */}
                      <div className="bg-[#FFF9F5] border border-dashed border-terracotta/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 font-manrope">
                        <div className="flex items-center gap-2 text-xs text-navy">
                          <ImageIcon className="w-4 h-4 text-terracotta" />
                          <span className="font-bold">Insert an Image into Content:</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={contentImageInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, false)}
                          />
                          <button
                            type="button"
                            onClick={() => contentImageInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="px-3 py-1.5 rounded-lg bg-white border border-terracotta/40 text-terracotta text-xs font-bold hover:bg-terracotta/10 flex items-center gap-1.5 cursor-pointer font-manrope"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingImage ? 'Uploading...' : 'Choose Image'}</span>
                          </button>

                          {uploadedImageUrl && (
                            <button
                              type="button"
                              onClick={() => handleInsertImageIntoContent(uploadedImageUrl)}
                              className="px-3 py-1.5 rounded-lg bg-terracotta text-white text-xs font-bold hover:bg-[#AA572D] flex items-center gap-1 cursor-pointer font-manrope"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insert into Article</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editor Pane (Visual / Markdown / Preview) */}
                      <div>
                        {editorMode === 'visual' && editorTab !== 'preview' ? (
                          <div className="relative">
                            <div
                              ref={visualEditorRef}
                              contentEditable
                              onInput={handleVisualInput}
                              onKeyUp={updateActiveTagVisual}
                              onMouseUp={updateActiveTagVisual}
                              onClick={updateActiveTagVisual}
                              onBlur={saveVisualSelection}
                              className="min-h-[420px] max-h-[600px] overflow-y-auto p-5 rounded-xl border border-black/10 bg-white focus:outline-none focus:border-terracotta select-text prose-hunhar"
                              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            />
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 font-manrope">
                              <span>Visual WYSIWYG Editor active — H2, H3, Tables, Lists render directly in live typography</span>
                              <span>Auto-syncs to Markdown</span>
                            </div>
                          </div>
                        ) : editorTab === 'preview' ? (
                          <div className="p-5 bg-white border border-black/10 rounded-xl max-h-[500px] overflow-y-auto prose-hunhar">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-manrope">
                              Live Article Render:
                            </div>
                            <h2 className="text-2xl font-medium text-navy font-makira uppercase">{formData.title}</h2>
                            <p className="font-manrope text-slate-600 text-sm font-normal not-italic mt-1 mb-3">{formData.excerpt}</p>
                            <hr className="my-3 border-black/5" />
                            <div className="text-sm space-y-2 text-slate-800 font-manrope [&_blockquote]:not-italic [&_blockquote]:font-normal [&_em]:not-italic [&_em]:font-normal [&_i]:not-italic">
                              {renderArticleContent(formData.content || '')}
                            </div>
                            {faqs.length > 0 && (
                              <BlogFaqSection faqs={faqs} className="my-6 pt-6 border-t border-black/10" />
                            )}
                          </div>
                        ) : (
                          <div>
                            <textarea
                              ref={contentTextareaRef}
                              onPaste={handleContentPaste}
                              onClick={updateActiveTag}
                              onKeyUp={updateActiveTag}
                              onSelect={updateActiveTag}
                              onBlur={saveTextareaCursor}
                              rows={18}
                              required
                              placeholder="Write your article in markdown. Use ## for headings, - for bullet points, > for quotes..."
                              value={formData.content}
                              onChange={(e) => {
                                setFormData({ ...formData, content: e.target.value })
                                updateActiveTag()
                              }}
                              className="w-full p-4 font-mono text-sm leading-relaxed text-navy border border-black/10 rounded-xl focus:outline-none focus:border-terracotta bg-slate-50/50"
                            />
                            <p className="mt-1.5 text-[11px] text-slate-400 font-manrope">
                              Raw Markdown Editor mode. Switch to Visual Editor anytime to see real H2 & tables.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* FAQ Section (SEO Rich Snippets) */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/[0.06]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
                            <h3 className="text-sm font-bold text-navy uppercase tracking-wider font-manrope">
                              Frequently Asked Questions (FAQ Section)
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-manrope">
                            Add Q&A pairs for this blog. Automatically generates Google <code className="font-mono text-terracotta bg-orange-50 px-1 py-0.5 rounded">FAQPage</code> schema for rich search results.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#FFF2E8] border border-[#F6D0B8] text-terracotta text-xs font-bold font-manrope">
                          {faqs.length} {faqs.length === 1 ? 'Question' : 'Questions'}
                        </span>
                      </div>

                      {faqs.length === 0 ? (
                        <div className="text-center py-8 px-4 border border-dashed border-black/10 rounded-xl bg-slate-50/50">
                          <p className="text-xs text-slate-500 mb-3 font-manrope">
                            No FAQ items added yet. Click below to add questions (Q1, Q2...) for SEO.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddFaq}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white text-xs font-bold hover:brightness-105 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md font-manrope"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Question (Q1)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {faqs.map((faq, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-xl border border-black/10 bg-[#FFFDFB] space-y-3 font-manrope"
                            >
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-bold text-xs tracking-wide shadow-xs">
                                  Q{index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFaq(index)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                                  title={`Delete Question ${index + 1}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                                  Question (Q{index + 1}) *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Who can repair peeling plaster in my old house in Chennai?"
                                  value={faq.question}
                                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                                  className="w-full px-3.5 py-2 text-sm text-navy bg-white border border-black/10 rounded-lg focus:outline-none focus:border-terracotta"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-navy uppercase tracking-wider mb-1">
                                  Answer (Q{index + 1}) *
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder={`Provide a clear, detailed answer to question ${index + 1}...`}
                                  value={faq.answer}
                                  onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                                  className="w-full px-3.5 py-2 text-sm text-navy bg-white border border-black/10 rounded-lg focus:outline-none focus:border-terracotta leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleAddFaq}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white text-xs font-bold hover:brightness-105 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md font-manrope"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Another Question (Q{faqs.length + 1})</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-4 space-y-6 font-manrope">
                    {/* Cover Image Box */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2 font-manrope">
                        Cover Image
                      </label>

                      <div className="rounded-xl overflow-hidden aspect-[16/10] bg-slate-100 border border-black/10 mb-3 relative group">
                        <img
                          src={fileUrl(formData.coverImage) || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, true)}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="flex-1 py-2.5 rounded-xl border border-terracotta text-terracotta text-xs font-bold hover:bg-terracotta/5 flex items-center justify-center gap-2 cursor-pointer transition-colors font-manrope"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingImage ? 'Uploading Image...' : (formData.coverImage ? 'Change Image' : 'Upload Cover Image')}</span>
                          </button>
                          {formData.coverImage && (
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 text-xs font-semibold cursor-pointer transition-colors"
                              title="Clear cover image"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="pt-2">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1 font-manrope">
                            Or paste image URL / file path:
                          </label>
                          <input
                            type="text"
                            placeholder="https://... or /projects/files/..."
                            value={formData.coverImage}
                            onChange={(e) =>
                              setFormData({ ...formData, coverImage: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg text-navy font-manrope focus:outline-none focus:border-terracotta"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Category & Tags */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2 font-manrope">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedCategory(val);
                            if (val === 'Others') {
                              setFormData((prev) => ({ ...prev, category: customCategory.trim() || 'Others' }));
                            } else {
                              setFormData((prev) => ({ ...prev, category: val }));
                            }
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs font-semibold text-navy bg-white focus:outline-none focus:border-terracotta font-manrope"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="Others">Others</option>
                        </select>

                        {selectedCategory === 'Others' && (
                          <div className="mt-2.5">
                            <label className="text-[11px] font-semibold text-slate-500 block mb-1 font-manrope">
                              Type Custom Category:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. AI & Automation, Marketing..."
                              value={customCategory}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomCategory(val);
                                setFormData((prev) => ({ ...prev, category: val.trim() || 'Others' }));
                              }}
                              className="w-full px-3 py-2 text-xs border border-terracotta/40 rounded-xl text-navy bg-orange-50/20 focus:outline-none focus:border-terracotta font-manrope"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2 font-manrope">
                          Tags (Comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Freelancing, Design, Escrow"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-black/10 rounded-xl text-navy font-manrope"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2 font-manrope">
                          Focus Keyword (SEO)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. hire student freelancers"
                          value={formData.focusKeyword}
                          onChange={(e) =>
                            setFormData({ ...formData, focusKeyword: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs border border-black/10 rounded-xl text-navy font-manrope"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2 font-manrope">
                        <input
                          type="checkbox"
                          id="featured-check"
                          checked={formData.featured}
                          onChange={(e) =>
                            setFormData({ ...formData, featured: e.target.checked })
                          }
                          className="rounded text-terracotta focus:ring-terracotta"
                        />
                        <label htmlFor="featured-check" className="text-xs font-bold text-navy cursor-pointer">
                          Feature on Blog Homepage Banner
                        </label>
                      </div>
                    </div>

                    {/* Author Profile */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3 font-manrope">
                        Author Profile
                      </label>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-black/5 font-manrope">
                        <img
                          src="/Hunhar_Blog_profile.png"
                          alt="Hunhar"
                          className="w-10 h-10 rounded-full object-cover border border-black/10 bg-white"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-navy">By Hunhar</span>
                          <span className="text-[11px] text-slate-500">SEO Team</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Google SERP Snippet Preview */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium font-makira uppercase tracking-wider text-navy">
                          <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                          <span>Google SERP Preview</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-manrope">(Click link to preview)</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left">
                        <a
                          href={formData.slug ? `/blog/${formData.slug}` : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!formData.slug) {
                              e.preventDefault();
                              showNotification('error', 'Please enter an article title first.');
                            }
                          }}
                          className="text-[11px] text-slate-500 font-mono truncate block hover:underline hover:text-navy cursor-pointer transition-colors"
                          title={formData.slug ? `Open /blog/${formData.slug} in new tab` : 'Enter title first'}
                        >
                          https://www.hunhar.in &gt; blog &gt; {formData.slug || 'article-slug'}
                        </a>
                        <a
                          href={formData.slug ? `/blog/${formData.slug}` : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!formData.slug) {
                              e.preventDefault();
                              showNotification('error', 'Please enter an article title first.');
                            }
                          }}
                          className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 mt-0.5 font-manrope block"
                          title={formData.slug ? `Open /blog/${formData.slug} in new tab` : 'Enter title first'}
                        >
                          {(() => {
                            const raw = formData.metaTitle || formData.title || 'Hunhar Article Title';
                            const clean = raw.replace(/\s*\|\s*Hunhar Blog/gi, '').trim();
                            return `${clean} | Hunhar Blog`;
                          })()}
                        </a>
                        <div className="text-xs text-[#4d5156] line-clamp-2 mt-1 font-manrope">
                          {formData.metaDescription || formData.excerpt || 'Article summary description snippet that will appear in search results on Google.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* Insert Link / Keyword Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-black/10 font-manrope">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm font-manrope">Add Link / Keyword</h3>
                  <p className="text-[11px] text-slate-500">Insert link with hover preview in article</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertLink} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5 font-manrope">
                  Text / Focus Keyword *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hunhar Freelancer Portal"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-black/10 rounded-xl focus:outline-none focus:border-terracotta text-navy font-manrope"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">This is the visible text or keyword readers will see and click on.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5 font-manrope">
                  Target URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://www.hunhar.in or /features"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-black/10 rounded-xl focus:outline-none focus:border-terracotta text-navy font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">When readers hover over this keyword, this URL will appear in a tooltip.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-terracotta hover:bg-[#AA572D] text-white shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Link</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Table Builder Modal */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-black/10 font-manrope my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-makira text-lg font-medium text-navy uppercase tracking-wide">
                    Table Builder
                  </h3>
                  <p className="text-xs text-slate-500 font-manrope">
                    Default heading & content box ready. Click <span className="font-bold text-terracotta">+</span> on any side to add boxes, or trash icon to delete.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Table Construction Area with 4-side + buttons */}
            <div className="py-6">
              {/* TOP SIDE: Add Column Left / Add Row Top buttons */}
              <div className="flex items-center justify-center mb-3 gap-2">
                <button
                  type="button"
                  onClick={handleAddColumnLeft}
                  className="px-3.5 py-1.5 rounded-xl border border-dashed border-terracotta/40 hover:border-terracotta bg-[#FFF9F5] hover:bg-terracotta/10 text-terracotta text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  title="Add Column to the Left"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Column (Left)</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddRowTop}
                  className="px-3.5 py-1.5 rounded-xl border border-dashed border-terracotta/40 hover:border-terracotta bg-[#FFF9F5] hover:bg-terracotta/10 text-terracotta text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                  title="Add Row to the Top"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Row (Top)</span>
                </button>
              </div>

              {/* CENTER: Grid with Right Column Adder */}
              <div className="flex items-start justify-center gap-3 overflow-x-auto p-2">
                {/* Table Grid */}
                <div className="min-w-fit border border-[#DECFBE] rounded-2xl overflow-hidden shadow-xs bg-[#FAF4EE]/30">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr className="bg-[#FAF4EE] border-b border-[#DECFBE]">
                        {tableHeaders.map((header, colIdx) => (
                          <th key={colIdx} className="p-2.5 border-r border-[#DECFBE] last:border-r-0 relative group min-w-[170px]">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-manrope">
                                Heading {colIdx + 1}
                              </span>
                              {tableHeaders.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColumn(colIdx)}
                                  className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                  title="Delete this column"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={header}
                              onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                              placeholder={`Heading ${colIdx + 1}`}
                              className="w-full px-3 py-2 text-sm font-makira font-bold uppercase tracking-wide bg-white border border-[#DECFBE] rounded-xl text-navy focus:outline-none focus:border-terracotta shadow-2xs"
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRowsData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-[#DECFBE] last:border-b-0 bg-white">
                          {row.map((cell, colIdx) => (
                            <td key={colIdx} className="p-2.5 border-r border-[#DECFBE] last:border-r-0 relative min-w-[170px]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-400 font-manrope">
                                  Row {rowIdx + 1} • Col {colIdx + 1}
                                </span>
                                {colIdx === 0 && tableRowsData.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(rowIdx)}
                                    className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                    title="Delete this row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                placeholder={`Content ${rowIdx + 1}.${colIdx + 1}`}
                                className="w-full px-3 py-2 text-sm font-manrope bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-terracotta focus:bg-white shadow-2xs"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RIGHT SIDE: + Add Column Button */}
                <div className="flex flex-col justify-center self-stretch">
                  <button
                    type="button"
                    onClick={() => handleAddColumn()}
                    className="h-full min-h-[140px] px-3.5 rounded-2xl border-2 border-dashed border-terracotta/40 hover:border-terracotta bg-[#FFF9F5] hover:bg-terracotta/10 text-terracotta flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group"
                    title="Add Column to the Right"
                  >
                    <div className="w-7 h-7 rounded-full bg-terracotta text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold font-manrope [writing-mode:vertical-rl] tracking-wide">
                      + Add Column
                    </span>
                  </button>
                </div>
              </div>

              {/* BOTTOM SIDE: + Add Row Button */}
              <div className="flex items-center justify-center mt-3">
                <button
                  type="button"
                  onClick={() => handleAddRow()}
                  className="w-full max-w-md py-2.5 rounded-xl border-2 border-dashed border-terracotta/40 hover:border-terracotta bg-[#FFF9F5] hover:bg-terracotta/10 text-terracotta text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group"
                  title="Add Row to the Bottom"
                >
                  <div className="w-5 h-5 rounded-full bg-terracotta text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span>+ Add Row (Bottom)</span>
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-black/5">
              <div className="text-xs text-slate-500 font-manrope">
                Current Table: <strong className="text-navy">{tableHeaders.length} Columns</strong> × <strong className="text-navy">{tableRowsData.length} Rows</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertBuiltTable}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-terracotta hover:bg-[#AA572D] text-white shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Insert Table into Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}
