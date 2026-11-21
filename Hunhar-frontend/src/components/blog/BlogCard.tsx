import React from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../types/blog';
import { Clock, Calendar, ArrowUpRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps): React.JSX.Element {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-black/[0.08] overflow-hidden hover:shadow-xl hover:border-terracotta/30 transition-all duration-300 hover:-translate-y-1">
      {/* Cover Image */}
      <Link to={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-terracotta tracking-wide shadow-sm font-manrope">
          {post.category}
        </div>
      </Link>

      {/* Card Content */}
      <div className="flex-1 flex flex-col p-6 sm:p-7">
        {/* Meta Header */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-3 font-manrope">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-terracotta" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-terracotta" />
            {post.readTime}
          </span>
        </div>

        {/* Title in Makira uppercase font */}
        <h3 className="font-makira text-lg sm:text-xl font-medium text-navy uppercase leading-snug mb-3 group-hover:text-terracotta transition-colors duration-200">
          <Link to={`/blog/${post.slug}`} className="no-underline hover:text-terracotta">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt in Manrope font */}
        <p className="font-manrope text-slate-600 text-sm leading-relaxed mb-6 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Card Footer: Author & Link */}
        <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between font-manrope">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.png"
              alt="Hunhar"
              className="w-8 h-8 rounded-full object-contain border border-black/10 bg-white p-1"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-navy">By Hunhar</span>
              <span className="text-[11px] text-slate-500">SEO Team</span>
            </div>
          </div>

          <Link
            to={`/blog/${post.slug}`}
            className="flex items-center gap-1 text-xs font-bold text-terracotta group-hover:translate-x-0.5 transition-transform duration-150 no-underline font-manrope"
          >
            <span>Read</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
