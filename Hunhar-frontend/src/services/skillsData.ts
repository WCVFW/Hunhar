export interface SkillItem {
  name: string
  category: string
}

export const COMPREHENSIVE_SKILLS: SkillItem[] = [
  // --- UI/UX & Product Design ---
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'Figma', category: 'Design' },
  { name: 'Product Design', category: 'Design' },
  { name: 'Design Systems', category: 'Design' },
  { name: 'Wireframing', category: 'Design' },
  { name: 'Interactive Prototyping', category: 'Design' },
  { name: 'User Research', category: 'Design' },
  { name: 'Usability Testing', category: 'Design' },
  { name: 'Mobile UI Design', category: 'Design' },
  { name: 'Web Design', category: 'Design' },
  { name: 'Adobe XD', category: 'Design' },
  { name: 'Sketch', category: 'Design' },
  { name: 'Micro-interactions', category: 'Design' },
  { name: 'Framer', category: 'Design' },
  { name: 'Information Architecture', category: 'Design' },
  { name: 'Design Thinking', category: 'Design' },

  // --- Graphic & Brand Design ---
  { name: 'Graphic Design', category: 'Design' },
  { name: 'Brand Identity', category: 'Design' },
  { name: 'Logo Design', category: 'Design' },
  { name: 'Typography', category: 'Design' },
  { name: 'Adobe Photoshop', category: 'Design' },
  { name: 'Adobe Illustrator', category: 'Design' },
  { name: 'Adobe InDesign', category: 'Design' },
  { name: 'Illustration', category: 'Design' },
  { name: 'Vector Art', category: 'Design' },
  { name: 'Iconography', category: 'Design' },
  { name: 'Packaging Design', category: 'Design' },
  { name: 'Print Design', category: 'Design' },
  { name: 'Canva Pro', category: 'Design' },
  { name: 'Poster & Banner Design', category: 'Design' },

  // --- 3D, Motion & Animation ---
  { name: '3D Modeling', category: '3D & Motion' },
  { name: 'Blender 3D', category: '3D & Motion' },
  { name: 'Cinema 4D', category: '3D & Motion' },
  { name: 'Maya', category: '3D & Motion' },
  { name: 'Spline 3D', category: '3D & Motion' },
  { name: 'Motion Graphics', category: '3D & Motion' },
  { name: 'Adobe After Effects', category: '3D & Motion' },
  { name: '2D Animation', category: '3D & Motion' },
  { name: '3D Animation', category: '3D & Motion' },
  { name: 'Visual Effects (VFX)', category: '3D & Motion' },
  { name: 'Character Animation', category: '3D & Motion' },
  { name: 'Lottie Animations', category: '3D & Motion' },
  { name: 'Augmented Reality (AR)', category: '3D & Motion' },
  { name: 'Virtual Reality (VR)', category: '3D & Motion' },
  { name: 'Unreal Engine', category: '3D & Motion' },
  { name: 'Unity 3D', category: '3D & Motion' },

  // --- Frontend Development ---
  { name: 'HTML5', category: 'Frontend' },
  { name: 'CSS3', category: 'Frontend' },
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'React.js', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Nuxt.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'SvelteKit', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Bootstrap', category: 'Frontend' },
  { name: 'Sass / SCSS', category: 'Frontend' },
  { name: 'Three.js', category: 'Frontend' },
  { name: 'WebGL', category: 'Frontend' },
  { name: 'GSAP Animation', category: 'Frontend' },
  { name: 'Redux Toolkit', category: 'Frontend' },
  { name: 'Zustand', category: 'Frontend' },
  { name: 'GraphQL', category: 'Frontend' },
  { name: 'Webflow', category: 'Frontend' },
  { name: 'WordPress', category: 'Frontend' },
  { name: 'Shopify', category: 'Frontend' },
  { name: 'Responsive Web Design', category: 'Frontend' },

  // --- Backend Development & Databases ---
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'NestJS', category: 'Backend' },
  { name: 'Python', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Flask', category: 'Backend' },
  { name: 'Java', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'Go (Golang)', category: 'Backend' },
  { name: 'Rust', category: 'Backend' },
  { name: 'PHP', category: 'Backend' },
  { name: 'Laravel', category: 'Backend' },
  { name: 'C# .NET', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Backend' },
  { name: 'MySQL', category: 'Backend' },
  { name: 'MongoDB', category: 'Backend' },
  { name: 'Redis', category: 'Backend' },
  { name: 'Prisma ORM', category: 'Backend' },
  { name: 'RESTful API Design', category: 'Backend' },
  { name: 'Microservices', category: 'Backend' },
  { name: 'WebSocket / Realtime', category: 'Backend' },

  // --- Mobile App Engineering ---
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter', category: 'Mobile' },
  { name: 'Dart', category: 'Mobile' },
  { name: 'iOS Development (Swift)', category: 'Mobile' },
  { name: 'SwiftUI', category: 'Mobile' },
  { name: 'Android Development (Kotlin)', category: 'Mobile' },
  { name: 'Jetpack Compose', category: 'Mobile' },
  { name: 'Expo', category: 'Mobile' },
  { name: 'Cross-Platform App Dev', category: 'Mobile' },

  // --- Cloud, DevOps & Infrastructure ---
  { name: 'Amazon Web Services (AWS)', category: 'Cloud & DevOps' },
  { name: 'Google Cloud Platform (GCP)', category: 'Cloud & DevOps' },
  { name: 'Microsoft Azure', category: 'Cloud & DevOps' },
  { name: 'Docker', category: 'Cloud & DevOps' },
  { name: 'Kubernetes', category: 'Cloud & DevOps' },
  { name: 'CI/CD Pipelines', category: 'Cloud & DevOps' },
  { name: 'Git & GitHub', category: 'Cloud & DevOps' },
  { name: 'Linux / Bash Scripting', category: 'Cloud & DevOps' },
  { name: 'Firebase', category: 'Cloud & DevOps' },
  { name: 'Supabase', category: 'Cloud & DevOps' },
  { name: 'Serverless Architecture', category: 'Cloud & DevOps' },
  { name: 'Nginx', category: 'Cloud & DevOps' },
  { name: 'Terraform', category: 'Cloud & DevOps' },

  // --- AI, Machine Learning & Emerging Tech ---
  { name: 'Artificial Intelligence (AI)', category: 'AI & Data' },
  { name: 'Machine Learning', category: 'AI & Data' },
  { name: 'Deep Learning', category: 'AI & Data' },
  { name: 'Generative AI', category: 'AI & Data' },
  { name: 'Prompt Engineering', category: 'AI & Data' },
  { name: 'Large Language Models (LLMs)', category: 'AI & Data' },
  { name: 'LangChain', category: 'AI & Data' },
  { name: 'OpenAI API Integration', category: 'AI & Data' },
  { name: 'Hugging Face', category: 'AI & Data' },
  { name: 'Natural Language Processing (NLP)', category: 'AI & Data' },
  { name: 'Computer Vision', category: 'AI & Data' },
  { name: 'PyTorch', category: 'AI & Data' },
  { name: 'TensorFlow', category: 'AI & Data' },
  { name: 'Data Science', category: 'AI & Data' },
  { name: 'Data Analysis', category: 'AI & Data' },
  { name: 'Pandas & NumPy', category: 'AI & Data' },
  { name: 'Power BI', category: 'AI & Data' },
  { name: 'Tableau', category: 'AI & Data' },
  { name: 'Web Scraping / Crawling', category: 'AI & Data' },
  { name: 'Smart Contracts (Solidity)', category: 'Web3 & Security' },
  { name: 'Web3 / Blockchain', category: 'Web3 & Security' },
  { name: 'Cybersecurity', category: 'Web3 & Security' },
  { name: 'Ethical Hacking', category: 'Web3 & Security' },

  // --- Video & Audio Production ---
  { name: 'Video Editing', category: 'Video & Audio' },
  { name: 'Adobe Premiere Pro', category: 'Video & Audio' },
  { name: 'DaVinci Resolve', category: 'Video & Audio' },
  { name: 'Final Cut Pro', category: 'Video & Audio' },
  { name: 'CapCut Pro', category: 'Video & Audio' },
  { name: 'Color Grading', category: 'Video & Audio' },
  { name: 'Sound Design', category: 'Video & Audio' },
  { name: 'Audio Mixing & Mastering', category: 'Video & Audio' },
  { name: 'Podcast Editing', category: 'Video & Audio' },
  { name: 'YouTube Video Production', category: 'Video & Audio' },
  { name: 'Instagram Reels & Shorts Editing', category: 'Video & Audio' },
  { name: 'Voiceover', category: 'Video & Audio' },

  // --- Marketing, SEO & Content Writing ---
  { name: 'Search Engine Optimization (SEO)', category: 'Marketing' },
  { name: 'Technical SEO', category: 'Marketing' },
  { name: 'On-Page SEO', category: 'Marketing' },
  { name: 'Content Marketing', category: 'Marketing' },
  { name: 'Social Media Marketing', category: 'Marketing' },
  { name: 'Performance Marketing', category: 'Marketing' },
  { name: 'Google Ads (SEM)', category: 'Marketing' },
  { name: 'Meta Ads (Facebook & Instagram)', category: 'Marketing' },
  { name: 'Email Marketing (Klaviyo / Mailchimp)', category: 'Marketing' },
  { name: 'Copywriting', category: 'Writing' },
  { name: 'Content Writing', category: 'Writing' },
  { name: 'Technical Writing', category: 'Writing' },
  { name: 'Blog & Article Writing', category: 'Writing' },
  { name: 'Scriptwriting', category: 'Writing' },
  { name: 'Growth Hacking', category: 'Marketing' },
  { name: 'Conversion Rate Optimization (CRO)', category: 'Marketing' },
  { name: 'Google Analytics 4 (GA4)', category: 'Marketing' },

  // --- Business, Product & Management ---
  { name: 'Product Management', category: 'Business' },
  { name: 'Agile & Scrum Methodologies', category: 'Business' },
  { name: 'Project Management', category: 'Business' },
  { name: 'Notion Workspace Design', category: 'Business' },
  { name: 'Jira & Confluence', category: 'Business' },
  { name: 'Market Research', category: 'Business' },
  { name: 'Pitch Decks & Presentations', category: 'Business' },
  { name: 'Financial Modeling', category: 'Business' },
  { name: 'Virtual Assistance', category: 'Business' },
  { name: 'Lead Generation', category: 'Business' },
  { name: 'E-commerce Management', category: 'Business' },
  { name: 'Zapier & Make Automation', category: 'Business' },
]

/**
 * Returns skill suggestions filtered by user input query,
 * ranked by relevance and matching profile domain.
 */
export function getSkillSuggestions(
  query: string,
  existingSkills: string[] = [],
  profileTitle: string = ''
): SkillItem[] {
  const q = query.trim().toLowerCase()
  const existingLower = new Set(existingSkills.map((s) => s.toLowerCase()))

  // Filter out already added skills
  const available = COMPREHENSIVE_SKILLS.filter(
    (item) => !existingLower.has(item.name.toLowerCase())
  )

  if (!q) {
    // If query is empty, suggest based on profile title keywords
    if (profileTitle) {
      const titleLower = profileTitle.toLowerCase()
      const titleMatches = available.filter((item) => {
        const catLower = item.category.toLowerCase()
        const nameLower = item.name.toLowerCase()
        return (
          (titleLower.includes('design') && (catLower.includes('design') || catLower.includes('3d'))) ||
          (titleLower.includes('dev') && (catLower.includes('front') || catLower.includes('back') || catLower.includes('mobile'))) ||
          (titleLower.includes('web') && catLower.includes('front')) ||
          (titleLower.includes('video') && catLower.includes('video')) ||
          (titleLower.includes('market') && catLower.includes('market')) ||
          (titleLower.includes('writer') && catLower.includes('writing')) ||
          (titleLower.includes('ai') && catLower.includes('ai')) ||
          nameLower.includes(titleLower)
        )
      })
      if (titleMatches.length > 0) {
        return titleMatches.slice(0, 10)
      }
    }
    // Default top diverse skills
    return available.slice(0, 10)
  }

  // Filter skills matching query
  const matches = available.filter((item) =>
    item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
  )

  // Rank matches:
  // 1. Starts with query
  // 2. Word inside starts with query
  // 3. Contains query
  return matches
    .sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()

      const aStarts = aName.startsWith(q)
      const bStarts = bName.startsWith(q)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      const aWordStarts = aName.split(/\s+/).some((w) => w.startsWith(q))
      const bWordStarts = bName.split(/\s+/).some((w) => w.startsWith(q))
      if (aWordStarts && !bWordStarts) return -1
      if (!aWordStarts && bWordStarts) return 1

      return a.name.localeCompare(b.name)
    })
    .slice(0, 12)
}
