import React, { useState, useEffect, useRef } from 'react';
import type { BlogPost, BlogPostInput } from '../types/blog';
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
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { blogApi, fileUrl, filesApi, getSessionRole, tokenStorage } from '../services/api';

const CATEGORIES = [
  'Freelancing Tips',
  'Hiring & Talent',
  'Student Success',
  'Design & Tech',
  'Business Growth',
];

const DEFAULT_AUTHORS = [
  {
    name: 'Hunhar Editorial Team',
    role: 'Platform Growth',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Arun Kumar',
    role: 'Community Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Meera S.',
    role: 'Lead UI Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Hunhar Safety Team',
    role: 'Trust & Security',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
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
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview' | 'split'>('split');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);

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
    setTagsInput('Freelance, Hunhar');
    setUploadedImageUrl('');
    setViewMode('edit');
  };

  // Start editing existing post
  const handleEditPost = (post: BlogPost) => {
    setFormData({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
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

      const payload = {
        ...formData,
        tags: processedTags,
        metaTitle: formData.metaTitle || `${formData.title} | Hunhar Blog`,
        metaDescription: formData.metaDescription || formData.excerpt,
      };

      await blogApi.save(payload);
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
      showNotification('success', 'Article deleted.');
      setDeleteConfirmId(null);
      await fetchPosts();
    } catch (err: any) {
      console.error('Delete error:', err);
      showNotification('error', err?.message || 'Error deleting post.');
    }
  };

  // Quick insertion helpers for editor
  const insertFormatting = (prefix: string, suffix = '') => {
    setFormData((prev) => ({
      ...prev,
      content: (prev.content || '') + `\n${prefix}Text${suffix}\n`,
    }));
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
                              <span>By {post.author.name}</span>
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
              <form onSubmit={handleSavePost} className="space-y-8 font-manrope">
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
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })
                      }
                      className="text-xs font-bold px-3 py-2 rounded-xl border border-black/15 bg-white text-navy focus:outline-none"
                    >
                      <option value="published">🟢 Published</option>
                      <option value="draft">🟡 Draft</option>
                    </select>

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
                    {/* Title */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
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
                            slug: prev.slug || newTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-'),
                          }));
                        }}
                        className="w-full px-4 py-3 text-lg font-bold text-navy border border-black/10 rounded-xl focus:outline-none focus:border-terracotta font-manrope"
                      />

                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 font-manrope">
                        <span className="font-semibold text-slate-400">URL:</span>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          https://www.hunhar.in/blog/{formData.slug || 'article-slug'}
                        </span>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <div className="flex items-center justify-between mb-2 font-manrope">
                        <label className="text-xs font-bold text-navy uppercase tracking-wider">
                          Excerpt &amp; Meta Description
                        </label>
                        <span
                          className={`text-[11px] font-semibold ${
                            (formData.excerpt?.length || 0) > 160
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {formData.excerpt?.length || 0} / 160 chars (Recommended for Google)
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Brief 1-2 sentence summary of what readers will learn in this post."
                        value={formData.excerpt}
                        onChange={(e) =>
                          setFormData({ ...formData, excerpt: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm text-navy border border-black/10 rounded-xl focus:outline-none focus:border-terracotta font-manrope"
                      />
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
                            onClick={() => setEditorTab('write')}
                            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                              editorTab === 'write' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            Write
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorTab('preview')}
                            className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                              editorTab === 'preview' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorTab('split')}
                            className={`hidden sm:block px-3 py-1 rounded-md font-semibold cursor-pointer ${
                              editorTab === 'split' ? 'bg-white text-navy shadow-sm' : 'text-slate-500'
                            }`}
                          >
                            Split Screen
                          </button>
                        </div>
                      </div>

                      {/* Formatting helper buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-black/5 text-xs text-slate-700 font-manrope">
                        <button
                          type="button"
                          onClick={() => insertFormatting('## ')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer font-makira"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('### ')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer font-makira"
                        >
                          H3
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('**', '**')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold cursor-pointer"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('*', '*')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded italic cursor-pointer"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('> ')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          &ldquo;Quote&rdquo;
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('- ')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('1. ')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                        >
                          1. Numbered
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('[Link Text](', ')')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer flex items-center gap-1"
                        >
                          <LinkIcon className="w-3 h-3" />
                          Link
                        </button>
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

                      {/* Textarea / Preview Pane */}
                      <div
                        className={`grid gap-4 ${
                          editorTab === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {(editorTab === 'write' || editorTab === 'split') && (
                          <div>
                            <textarea
                              rows={18}
                              required
                              placeholder="Write your article in markdown. Use ## for headings, - for bullet points, > for quotes..."
                              value={formData.content}
                              onChange={(e) =>
                                setFormData({ ...formData, content: e.target.value })
                              }
                              className="w-full p-4 font-mono text-sm leading-relaxed text-navy border border-black/10 rounded-xl focus:outline-none focus:border-terracotta bg-slate-50/50"
                            />
                          </div>
                        )}

                        {(editorTab === 'preview' || editorTab === 'split') && (
                          <div className="p-4 bg-white border border-black/10 rounded-xl max-h-[460px] overflow-y-auto prose-hunhar">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-manrope">
                              Live Render Preview:
                            </div>
                            {/* Preview Title in Makira */}
                            <h2 className="text-xl font-medium text-navy font-makira uppercase">{formData.title}</h2>
                            {/* Preview Excerpt in Manrope */}
                            <p className="font-manrope text-slate-600 text-sm italic">{formData.excerpt}</p>
                            <hr className="my-3 border-black/5" />
                            <div className="text-sm space-y-2 text-slate-800 whitespace-pre-wrap font-manrope">
                              {formData.content}
                            </div>
                          </div>
                        )}
                      </div>
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
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="w-full py-2.5 rounded-xl border border-terracotta text-terracotta text-xs font-bold hover:bg-terracotta/5 flex items-center justify-center gap-2 cursor-pointer transition-colors font-manrope"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingImage ? 'Uploading Image...' : 'Upload Cover Image'}</span>
                        </button>

                        <div className="pt-2">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-1 font-manrope">
                            Or paste image URL:
                          </label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={formData.coverImage}
                            onChange={(e) =>
                              setFormData({ ...formData, coverImage: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs border border-black/10 rounded-lg text-navy font-manrope"
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
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({ ...formData, category: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs font-semibold text-navy bg-white focus:outline-none focus:border-terracotta font-manrope"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
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

                    {/* Author selector */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2 font-manrope">
                        Author Profile
                      </label>
                      <select
                        value={formData.author.name}
                        onChange={(e) => {
                          const selected = DEFAULT_AUTHORS.find((a) => a.name === e.target.value);
                          if (selected) {
                            setFormData({ ...formData, author: selected });
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-xs font-semibold text-navy bg-white focus:outline-none font-manrope"
                      >
                        {DEFAULT_AUTHORS.map((auth) => (
                          <option key={auth.name} value={auth.name}>
                            {auth.name} ({auth.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Live Google SERP Snippet Preview */}
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-medium font-makira uppercase tracking-wider text-navy mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                        <span>Google SERP Preview</span>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left">
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          https://www.hunhar.in &gt; blog &gt; {formData.slug || 'article-slug'}
                        </div>
                        <div className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 mt-0.5 font-manrope">
                          {formData.metaTitle || formData.title || 'Hunhar Article Title'} | Hunhar Blog
                        </div>
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
      </main>
      <Footer />
    </div>
  );
}
