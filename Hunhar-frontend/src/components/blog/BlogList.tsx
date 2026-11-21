import React, { useState, useMemo } from 'react';
import type { BlogPost } from '../../types/blog';
import BlogCard from './BlogCard';
import CategoryFilter from './CategoryFilter';
import { Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogListProps {
  initialPosts: BlogPost[];
}

export default function BlogList({ initialPosts }: BlogListProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('All');
    initialPosts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [initialPosts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        post.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [initialPosts, selectedCategory, searchQuery]);

  // Featured post (first featured post or first post if 'All' is selected and no search)
  const featuredPost = useMemo(() => {
    if (selectedCategory !== 'All' || searchQuery) return null;
    return initialPosts.find((p) => p.featured) || initialPosts[0] || null;
  }, [initialPosts, selectedCategory, searchQuery]);

  // Regular grid posts (exclude the featured post from the grid when featured is showing)
  const gridPosts = useMemo(() => {
    if (featuredPost && selectedCategory === 'All' && !searchQuery) {
      return filteredPosts.filter((p) => p.id !== featuredPost.id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost, selectedCategory, searchQuery]);

  return (
    <div className="w-full">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10 pb-6 border-b border-black/[0.08] font-manrope">
        <CategoryFilter
          categories={categories}
          activeCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles, guides, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-black/10 rounded-full focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all placeholder:text-slate-400 text-navy font-manrope"
          />
        </div>
      </div>

      {/* Featured Banner Article (when no active search and category is All) */}
      {featuredPost && (
        <div className="mb-14">
          <div className="relative bg-gradient-to-br from-navy via-[#0c234b] to-[#07152B] rounded-3xl overflow-hidden text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
            {/* Background pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Left Content */}
            <div className="relative z-10 lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/20 border border-terracotta/40 text-[#FFA066] text-xs font-bold mb-4 font-manrope">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Guide • {featuredPost.category}</span>
              </div>

              {/* Title in Makira uppercase font */}
              <h2 className="font-makira text-2xl sm:text-3xl lg:text-4xl font-medium text-white uppercase leading-tight mb-4">
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="no-underline text-white hover:text-[#FFA066] transition-colors"
                >
                  {featuredPost.title}
                </Link>
              </h2>

              {/* Excerpt in Manrope font */}
              <p className="font-manrope text-white/80 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                {featuredPost.excerpt}
              </p>

              {/* Author and Read CTA */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 w-full font-manrope">
                <div className="flex items-center gap-3">
                  <img
                    src="/favicon.png"
                    alt="Hunhar"
                    className="w-10 h-10 rounded-full object-contain border-2 border-white/20 bg-white p-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      By Hunhar
                    </span>
                    <span className="text-xs text-white/60">
                      SEO Team • {featuredPost.readTime}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E2985B] via-[#CD7238] to-[#BA5C2E] text-white font-semibold text-sm hover:brightness-110 shadow-md transition-all no-underline font-manrope"
                >
                  <span>Read Article</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Right Cover Image */}
            <div className="relative z-10 lg:col-span-5 h-64 sm:h-80 lg:h-full w-full rounded-2xl overflow-hidden shadow-2xl">
              <Link to={`/blog/${featuredPost.slug}`} className="block w-full h-full">
                <img
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Articles */}
      {gridPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gridPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-black/[0.08] p-8 font-manrope">
          <p className="text-lg font-semibold text-navy mb-2">No articles found</p>
          <p className="text-sm text-slate-500 mb-6">
            We couldn&apos;t find any posts matching &ldquo;{searchQuery}&rdquo;. Try another keyword or browse all categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-full bg-terracotta text-white font-medium text-xs hover:bg-[#AA572D] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
