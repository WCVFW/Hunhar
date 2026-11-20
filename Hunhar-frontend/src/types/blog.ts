export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown or HTML formatted content
  coverImage: string;
  category: string;
  tags: string[];
  author: BlogAuthor;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  status: 'published' | 'draft';
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  featured?: boolean;
}

export type BlogPostInput = Omit<BlogPost, 'id' | 'readTime' | 'publishedAt'> & {
  id?: string;
  readTime?: string;
  publishedAt?: string;
};
