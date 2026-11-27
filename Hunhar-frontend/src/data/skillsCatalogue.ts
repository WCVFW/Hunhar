export type RiskLevel = 'Green' | 'Yellow' | 'Orange' | 'Red'

export interface SkillItem {
  id: number
  name: string
  category: string
  risk: RiskLevel
  count: number
  isMonthly?: boolean
  phases: string[]
  suggestedSkills?: string[]
}

export interface CategoryGroup {
  name: string
  risk: RiskLevel
  skills: SkillItem[]
}

export const SKILLS_CATALOGUE: SkillItem[] = [
  // 1. Websites & Apps
  {
    id: 1,
    name: 'Website development',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 5,
    phases: [
      'Brief, sitemap and tech stack locked',
      'Page designs or template approved',
      'Front-end built on a staging link',
      'Back-end, forms and testing',
      'Live deploy, handover, 7-day fix window',
    ],
    suggestedSkills: ['React', 'Next.js', 'HTML/CSS', 'JavaScript', 'Node.js', 'Tailwind CSS'],
  },
  {
    id: 2,
    name: 'Website page coding (front-end)',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 4,
    phases: [
      'Design files and browser list received',
      'Desktop layout coded',
      'Mobile and tablet made responsive',
      'Cross-browser check, code handover',
    ],
    suggestedSkills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS', 'Responsive Design'],
  },
  {
    id: 3,
    name: 'Mobile app development',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 5,
    phases: [
      'Feature list and platforms locked',
      'Screens and app flow approved',
      'Core build — first working version',
      'Testing and bug fixes on real devices',
      'Store-ready build plus source handover',
    ],
    suggestedSkills: ['Flutter', 'React Native', 'Android', 'iOS', 'Firebase', 'Mobile UI'],
  },
  {
    id: 4,
    name: 'WordPress & Shopify websites',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 4,
    isMonthly: true,
    phases: [
      'Pages, theme and plugin list agreed',
      'Theme set up with real content',
      'Client walkthrough and changes',
      'Go live, admin handover, backup set',
    ],
    suggestedSkills: ['WordPress', 'Shopify', 'WooCommerce', 'Elementor', 'Liquid', 'E-commerce'],
  },
  {
    id: 5,
    name: 'Bug fixing & testing',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 3,
    isMonthly: true,
    phases: [
      'Bug reproduced, cause reported',
      'Fix applied on a copy, shown working',
      'Client confirms, fix pushed live',
    ],
    suggestedSkills: ['Debugging', 'QA Testing', 'JavaScript', 'Python', 'Web Testing'],
  },
  {
    id: 6,
    name: 'Automating repeat work (scripts)',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 3,
    phases: [
      'Current manual steps mapped',
      'Script built, test run shown',
      'Deployed with run instructions',
    ],
    suggestedSkills: ['Python', 'Automation', 'Bash', 'Web Scraping', 'APIs', 'Google Sheets Script'],
  },
  {
    id: 7,
    name: 'Online store setup',
    category: 'Websites & Apps',
    risk: 'Orange',
    count: 4,
    phases: [
      'Product list, payment and courier chosen',
      'Store built with the first 10 products',
      'Test order run end to end',
      'Live, with a how-to-add-products video',
    ],
    suggestedSkills: ['Shopify', 'WooCommerce', 'Payment Gateways', 'Store Design', 'Inventory Setup'],
  },

  // 2. AI
  {
    id: 8,
    name: 'Adding AI to an app or website',
    category: 'AI',
    risk: 'Orange',
    count: 4,
    phases: [
      'Use case, API and monthly budget agreed',
      'Prototype on one feature',
      'Full integration with error handling',
      'Live, with running cost and limits documented',
    ],
    suggestedSkills: ['OpenAI API', 'Gemini API', 'Python', 'LangChain', 'FastAPI', 'AI Integration'],
  },
  {
    id: 9,
    name: 'Chatbot & WhatsApp bot making',
    category: 'AI',
    risk: 'Orange',
    count: 4,
    phases: [
      'Question list and conversation flow agreed',
      'Flow built, demo link shared',
      'Client tests, replies tuned',
      'Connected to the live number or page',
    ],
    suggestedSkills: ['WhatsApp Business API', 'Chatbots', 'Dialogflow', 'Node.js', 'Bot Automation'],
  },
  {
    id: 10,
    name: 'AI prompt & workflow setup',
    category: 'AI',
    risk: 'Orange',
    count: 3,
    phases: [
      'Tasks to automate listed',
      'Prompts and automation built, demo run',
      'Handover doc plus team walkthrough',
    ],
    suggestedSkills: ['Prompt Engineering', 'Zapier', 'Make.com', 'ChatGPT', 'AI Workflows'],
  },
  {
    id: 11,
    name: 'Tagging data for AI (data labelling)',
    category: 'AI',
    risk: 'Orange',
    count: 3,
    phases: [
      'Labelling rules and sample set agreed',
      'First batch tagged, accuracy checked',
      'Full set tagged and delivered',
    ],
    suggestedSkills: ['Data Annotation', 'Data Labelling', 'Bounding Boxes', 'NLP Annotation', 'Data Cleaning'],
  },

  // 3. Design
  {
    id: 12,
    name: 'Logo design',
    category: 'Design',
    risk: 'Green',
    count: 4,
    phases: [
      'Brand brief and references',
      'Three concept directions',
      'Chosen direction refined — colour and type',
      'Full file pack plus usage sheet',
    ],
    suggestedSkills: ['Logo Design', 'Adobe Illustrator', 'Brand Identity', 'Vector Art', 'Typography'],
  },
  {
    id: 13,
    name: 'Social media post design',
    category: 'Design',
    risk: 'Green',
    count: 3,
    isMonthly: true,
    phases: [
      'Brief, brand kit and post list',
      'Two sample posts for approval',
      'Full batch delivered in every size',
    ],
    suggestedSkills: ['Canva', 'Photoshop', 'Social Media Graphics', 'Instagram Posts', 'Ad Creatives'],
  },
  {
    id: 14,
    name: 'App & website screen design (UI/UX)',
    category: 'Design',
    risk: 'Green',
    count: 4,
    phases: [
      'Screen list and user flow agreed',
      'Wireframes approved',
      'Visual design of all screens',
      'Clickable prototype and developer handover',
    ],
    suggestedSkills: ['Figma', 'UI/UX Design', 'Wireframing', 'Prototyping', 'Design Systems', 'Mobile App Design'],
  },
  {
    id: 15,
    name: 'Poster & invite design',
    category: 'Design',
    risk: 'Green',
    count: 3,
    phases: [
      'Content, size and style locked',
      'Draft with two layout options',
      'Print-ready final files',
    ],
    suggestedSkills: ['Poster Design', 'Event Invites', 'Photoshop', 'Print Design', 'Illustrator'],
  },
  {
    id: 16,
    name: 'Presentation design',
    category: 'Design',
    risk: 'Green',
    count: 4,
    phases: [
      'Content and slide count received',
      'Template plus three sample slides',
      'All slides designed',
      'Changes and editable file handover',
    ],
    suggestedSkills: ['PowerPoint', 'Pitch Deck', 'Keynote', 'Google Slides', 'Visual Storytelling'],
  },
  {
    id: 17,
    name: 'YouTube thumbnail design',
    category: 'Design',
    risk: 'Green',
    count: 2,
    phases: [
      'Video, title and reference style given',
      'Two options delivered, one revision',
    ],
    suggestedSkills: ['Thumbnail Design', 'Photoshop', 'CTR Optimization', 'YouTube Graphics'],
  },
  {
    id: 18,
    name: 'Photo background removal & touch-up',
    category: 'Design',
    risk: 'Green',
    count: 2,
    phases: [
      'Photos and output format received',
      'Edited set delivered, one correction pass',
    ],
    suggestedSkills: ['Photo Editing', 'Photoshop', 'Background Removal', 'Retouching', 'E-commerce Photos'],
  },
  {
    id: 19,
    name: 'Template making',
    category: 'Design',
    risk: 'Green',
    count: 3,
    phases: [
      'Use case and fields agreed',
      'Template built with a sample filled in',
      'Delivered with a short how-to-use note',
    ],
    suggestedSkills: ['Canva Templates', 'Notion Templates', 'Document Templates', 'Figma Templates'],
  },

  // 4. Art & Gifts
  {
    id: 20,
    name: 'Illustration & drawing',
    category: 'Art & Gifts',
    risk: 'Green',
    count: 4,
    phases: [
      'Brief, style and references',
      'Rough sketch approved',
      'Line work and colour',
      'Final files in every size needed',
    ],
    suggestedSkills: ['Digital Drawing', 'Procreate', 'Adobe Illustrator', 'Character Art', 'Sketching'],
  },
  {
    id: 21,
    name: 'Calligraphy & name art',
    category: 'Art & Gifts',
    risk: 'Green',
    count: 3,
    phases: [
      'Words, style and use agreed',
      'Draft in two hands',
      'Final in print and digital formats',
    ],
    suggestedSkills: ['Calligraphy', 'Lettering', 'Typography', 'Custom Name Art'],
  },
  {
    id: 22,
    name: 'Portrait & caricature drawing',
    category: 'Art & Gifts',
    risk: 'Green',
    count: 3,
    phases: [
      'Photo and style chosen',
      'Sketch shown for approval',
      'Final artwork, print-ready',
    ],
    suggestedSkills: ['Portrait Drawing', 'Caricature', 'Digital Painting', 'Handmade Art'],
  },
  {
    id: 23,
    name: 'Cartoon-style portraits from photos',
    category: 'Art & Gifts',
    risk: 'Green',
    count: 3,
    phases: [
      'Photo, style and background agreed',
      'Draft shared for changes',
      'Final in print and phone sizes',
    ],
    suggestedSkills: ['Cartoon Portrait', 'Avatar Art', 'Vector Portrait', 'Procreate'],
  },

  // 5. Video
  {
    id: 24,
    name: 'Reel direction & concept',
    category: 'Video',
    risk: 'Yellow',
    count: 3,
    isMonthly: true,
    phases: [
      'Goal, audience and references',
      'Hook, script and shot list approved',
      'Live direction on the shoot day',
    ],
    suggestedSkills: ['Reel Direction', 'Scriptwriting', 'Video Hooks', 'Content Ideation'],
  },
  {
    id: 25,
    name: 'Reels filmed by the student (UGC)',
    category: 'Video',
    risk: 'Yellow',
    count: 4,
    isMonthly: true,
    phases: [
      'Brief, product and talking points',
      'Script and setup approved',
      'Filming — raw clips shared',
      'Selected takes delivered, one reshoot',
    ],
    suggestedSkills: ['UGC Video', 'On-Camera Acting', 'Product Review', 'Short Form Video'],
  },
  {
    id: 26,
    name: 'Reels & shorts editing',
    category: 'Video',
    risk: 'Yellow',
    count: 3,
    isMonthly: true,
    phases: [
      'Footage, style and music received',
      'First cut for review',
      'Final with captions, one round of changes',
    ],
    suggestedSkills: ['CapCut', 'Premiere Pro', 'Subtitles & Captions', 'Sound Effects', 'Short Form Editing'],
  },
  {
    id: 27,
    name: 'YouTube video editing',
    category: 'Video',
    risk: 'Yellow',
    count: 4,
    isMonthly: true,
    phases: [
      'Footage and reference style received',
      'Rough cut — structure only',
      'Full edit with graphics and sound',
      'Changes and final export',
    ],
    suggestedSkills: ['Adobe Premiere Pro', 'DaVinci Resolve', 'Pacing & B-roll', 'Sound Design', 'Color Grading'],
  },
  {
    id: 28,
    name: 'Animation & motion graphics',
    category: 'Video',
    risk: 'Yellow',
    count: 5,
    phases: [
      'Script and style locked',
      'Storyboard approved',
      'Design of frames and characters',
      'Animation first pass',
      'Sound, changes, final export',
    ],
    suggestedSkills: ['After Effects', '2D Animation', 'Motion Graphics', 'Lottie', 'Explainer Videos'],
  },
  {
    id: 29,
    name: 'AI video making',
    category: 'Video',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Script, tool and look agreed',
      'Ten-second sample test',
      'Full video generated and assembled',
      'Changes and final export',
    ],
    suggestedSkills: ['AI Video', 'Runway', 'Midjourney', 'Pika', 'ElevenLabs'],
  },
  {
    id: 30,
    name: 'Birthday & anniversary videos',
    category: 'Video',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Photos, music and message collected',
      'Draft shared',
      'Final after one round of changes',
    ],
    suggestedSkills: ['Video Collage', 'Photo Slideshow', 'Special Occasion Video', 'CapCut'],
  },

  // 6. Audio & Music
  {
    id: 31,
    name: 'Voice-over & dubbing',
    category: 'Audio & Music',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Script, tone and one sample line approved',
      'Full recording delivered',
      'Retakes and cleaned final audio',
    ],
    suggestedSkills: ['Voice Over', 'Audio Recording', 'Dubbing', 'Audacity', 'Narration'],
  },
  {
    id: 32,
    name: 'Music & beat making',
    category: 'Audio & Music',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Reference tracks and mood agreed',
      'Thirty-second demo loop',
      'Full track arranged',
      'Mix, master and stems handover',
    ],
    suggestedSkills: ['FL Studio', 'Logic Pro', 'Beat Making', 'Music Production', 'Mixing & Mastering'],
  },
  {
    id: 33,
    name: 'Audio typed out (transcription)',
    category: 'Audio & Music',
    risk: 'Yellow',
    count: 2,
    phases: [
      'Audio and output format received',
      'Transcript delivered, one correction pass',
    ],
    suggestedSkills: ['Audio Transcription', 'Fast Typing', 'Timestamping', 'Subtitling'],
  },

  // 7. Writing
  {
    id: 34,
    name: 'Blog & article writing',
    category: 'Writing',
    risk: 'Yellow',
    count: 3,
    isMonthly: true,
    phases: [
      'Topic, angle and outline approved',
      'Full draft',
      'One revision, final with image suggestions',
    ],
    suggestedSkills: ['Blog Writing', 'Article Writing', 'Content Writing', 'Research', 'SEO Basics'],
  },
  {
    id: 35,
    name: 'Writing that ranks on Google (SEO writing)',
    category: 'Writing',
    risk: 'Yellow',
    count: 4,
    isMonthly: true,
    phases: [
      'Keyword and topic agreed',
      'Outline with headings approved',
      'Full draft written',
      'On-page SEO — title, meta, links — and final',
    ],
    suggestedSkills: ['SEO Writing', 'Keyword Research', 'On-Page SEO', 'Search Intent', 'Content Optimization'],
  },
  {
    id: 36,
    name: 'Ad & sales copywriting',
    category: 'Writing',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Product, audience and offer brief',
      'Three variations for testing',
      'Chosen one refined, final copy',
    ],
    suggestedSkills: ['Copywriting', 'Ad Copy', 'Sales Letters', 'Landing Page Copy', 'Hook Writing'],
  },
  {
    id: 37,
    name: 'Resume & LinkedIn writing',
    category: 'Writing',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Current profile and target role received',
      'Rewritten draft',
      'One revision, final in Word and PDF',
    ],
    suggestedSkills: ['Resume Writing', 'CV Optimization', 'LinkedIn Profile', 'ATS Optimization'],
  },
  {
    id: 38,
    name: 'Manuals & how-to guides (technical writing)',
    category: 'Writing',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Product access and audience agreed',
      'Structure and contents page approved',
      'Full draft with screenshots',
      'Review, changes, final formats',
    ],
    suggestedSkills: ['Technical Writing', 'User Guides', 'Documentation', 'Process Mapping'],
  },
  {
    id: 39,
    name: 'Caption & hashtag writing',
    category: 'Writing',
    risk: 'Yellow',
    count: 2,
    isMonthly: true,
    phases: [
      'Posts, brand voice and goal given',
      'Captions and tag sets delivered, one revision',
    ],
    suggestedSkills: ['Instagram Captions', 'Hashtags', 'Social Media Copy', 'Microcopy'],
  },
  {
    id: 40,
    name: 'Proofreading & grammar check',
    category: 'Writing',
    risk: 'Yellow',
    count: 2,
    phases: [
      'Document and style preference received',
      'Corrected file with changes marked',
    ],
    suggestedSkills: ['Proofreading', 'Grammar Check', 'Copyediting', 'Line Editing'],
  },
  {
    id: 41,
    name: 'Study notes making',
    category: 'Writing',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Syllabus, unit and format agreed',
      'First unit sent for approval',
      'Full notes delivered',
    ],
    suggestedSkills: ['Note Making', 'Study Summaries', 'Academic Notes', 'Diagrams'],
  },

  // 8. Speeches & Poems
  {
    id: 42,
    name: 'Poem & shayari writing',
    category: 'Speeches & Poems',
    risk: 'Green',
    count: 2,
    phases: [
      'Occasion, names and tone given',
      'Verse delivered with one rewrite',
    ],
    suggestedSkills: ['Poetry', 'Shayari', 'Hindi/Urdu/English Verse', 'Rhyme & Rhythm'],
  },
  {
    id: 43,
    name: 'Speech & anchoring scripts',
    category: 'Speeches & Poems',
    risk: 'Green',
    count: 3,
    phases: [
      'Event, audience and length agreed',
      'Draft script',
      'Final after a read-through and changes',
    ],
    suggestedSkills: ['Speech Writing', 'Anchoring Script', 'Public Speaking', 'Event Scripts'],
  },
  {
    id: 44,
    name: 'Roast & toast writing',
    category: 'Speeches & Poems',
    risk: 'Green',
    count: 3,
    phases: [
      'Person, stories and limits agreed',
      'Draft',
      'Final with timing and delivery notes',
    ],
    suggestedSkills: ['Humour Writing', 'Toast Speeches', 'Roast Jokes', 'Timing & Delivery'],
  },
  {
    id: 45,
    name: 'Apology & confession message writing',
    category: 'Speeches & Poems',
    risk: 'Green',
    count: 2,
    phases: [
      'Situation and tone understood',
      'Message delivered with one rewrite',
    ],
    suggestedSkills: ['Empathy Writing', 'Personal Messages', 'Letter Writing'],
  },
  {
    id: 46,
    name: 'Wedding hashtag & couple name making',
    category: 'Speeches & Poems',
    risk: 'Green',
    count: 2,
    phases: [
      'Names and vibe given',
      'Ten options delivered, one more round',
    ],
    suggestedSkills: ['Wordplay', 'Wedding Hashtags', 'Creative Naming', 'Branding'],
  },
  {
    id: 47,
    name: 'Quiz, trivia & treasure-hunt writing',
    category: 'Speeches & Poems',
    risk: 'Green',
    count: 3,
    phases: [
      'Theme, difficulty and count agreed',
      'Draft set for review',
      'Final with answer key and clue placement',
    ],
    suggestedSkills: ['Trivia Questions', 'Quiz Creation', 'Treasure Hunt Clues', 'Game Writing'],
  },

  // 9. Marketing
  {
    id: 48,
    name: 'Social media handling',
    category: 'Marketing',
    risk: 'Orange',
    count: 4,
    isMonthly: true,
    phases: [
      "Account access and the month's plan approved",
      'Content calendar signed off',
      'Posting and daily replies through the month',
      'Month-end report and next month\'s plan',
    ],
    suggestedSkills: ['Social Media Management', 'Instagram Growth', 'Content Calendar', 'Community Engagement'],
  },
  {
    id: 49,
    name: 'Getting found on Google (SEO)',
    category: 'Marketing',
    risk: 'Orange',
    count: 5,
    isMonthly: true,
    phases: [
      'Access granted and site audited',
      'Keyword plan approved',
      'On-page fixes done',
      'Content and backlinks through the month',
      'Monthly ranking report',
    ],
    suggestedSkills: ['SEO', 'Google Search Console', 'Technical SEO', 'Backlinks', 'Rank Tracking'],
  },
  {
    id: 50,
    name: 'Google & Meta ads',
    category: 'Marketing',
    risk: 'Orange',
    count: 4,
    isMonthly: true,
    phases: [
      'Access, budget and goal agreed',
      'Campaigns built and launched',
      'Weekly watching and adjusting',
      'Month-end spend and result report',
    ],
    suggestedSkills: ['Meta Ads Manager', 'Google Ads', 'PPC', 'Campaign Optimization', 'ROAS Analysis'],
  },
  {
    id: 51,
    name: 'Email marketing & leads',
    category: 'Marketing',
    risk: 'Orange',
    count: 4,
    isMonthly: true,
    phases: [
      'Audience and offer agreed',
      'List built or cleaned',
      'Mails written and scheduled',
      'Send report — opens, clicks, leads',
    ],
    suggestedSkills: ['Email Campaigns', 'Mailchimp', 'Lead Generation', 'Newsletter Strategy'],
  },
  {
    id: 52,
    name: 'Influencer outreach',
    category: 'Marketing',
    risk: 'Orange',
    count: 3,
    isMonthly: true,
    phases: [
      'Brief, budget and creator type agreed',
      'Shortlist with rates shared',
      'Outreach done, replies handed over',
    ],
    suggestedSkills: ['Influencer Marketing', 'Creator Outreach', 'Negotiation', 'Brand Partnerships'],
  },
  {
    id: 53,
    name: 'Instagram bio & profile glow-up',
    category: 'Marketing',
    risk: 'Orange',
    count: 3,
    phases: [
      'Current profile and goal reviewed',
      'Bio, name and highlight plan shared',
      'Covers delivered and profile set up',
    ],
    suggestedSkills: ['Profile Optimization', 'Bio Writing', 'Story Highlights', 'Instagram Branding'],
  },

  // 10. Languages
  {
    id: 54,
    name: 'Translation & subtitles',
    category: 'Languages',
    risk: 'Yellow',
    count: 3,
    isMonthly: true,
    phases: [
      'File, language pair and tone agreed',
      'Translation first pass',
      'Review, timing sync, final file',
    ],
    suggestedSkills: ['Translation', 'Subtitling', 'Hindi/Tamil/Telugu/English', 'SRT Editing'],
  },
  {
    id: 55,
    name: 'Regional language content',
    category: 'Languages',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Topic, language and audience agreed',
      'Draft script or copy',
      'Final after changes',
    ],
    suggestedSkills: ['Regional Content', 'Vernacular Copy', 'Localization', 'Script Adaptation'],
  },

  // 11. Data & Research
  {
    id: 56,
    name: 'Data entry',
    category: 'Data & Research',
    risk: 'Orange',
    count: 2,
    isMonthly: true,
    phases: [
      'Source files and format agreed',
      'Entered sheet delivered, one correction pass',
    ],
    suggestedSkills: ['Data Entry', 'Excel', 'Google Sheets', 'Accuracy & Speed'],
  },
  {
    id: 57,
    name: 'Excel & data reports',
    category: 'Data & Research',
    risk: 'Orange',
    count: 3,
    phases: [
      'Raw data and the questions received',
      'Cleaned data plus draft sheet',
      'Final with charts and a short read-out',
    ],
    suggestedSkills: ['Advanced Excel', 'Pivot Tables', 'Formulas (VLOOKUP/XLOOKUP)', 'Charts & Dashboards'],
  },
  {
    id: 58,
    name: 'Market research',
    category: 'Data & Research',
    risk: 'Orange',
    count: 3,
    phases: [
      'Questions and competitor list agreed',
      'Data collected in a sheet',
      'Findings summary delivered',
    ],
    suggestedSkills: ['Market Analysis', 'Competitor Research', 'Data Synthesis', 'Report Summary'],
  },

  // 12. Office Help
  {
    id: 59,
    name: 'Virtual assistant',
    category: 'Office Help',
    risk: 'Orange',
    count: 3,
    isMonthly: true,
    phases: [
      'Tasks, hours and access agreed',
      'Weekly work against a shared task list',
      'Month-end summary of hours and work done',
    ],
    suggestedSkills: ['Virtual Assistance', 'Email Management', 'Scheduling', 'Administrative Support'],
  },
  {
    id: 60,
    name: 'Accounts & GST work',
    category: 'Office Help',
    risk: 'Orange',
    count: 4,
    isMonthly: true,
    phases: [
      'Access, books and period agreed',
      'Entries posted',
      'Reconciliation and returns prepped',
      'Handed to the client or their CA to file',
    ],
    suggestedSkills: ['Bookkeeping', 'GST Filing Basics', 'Tally', 'Invoicing', 'Reconciliation'],
  },
  {
    id: 61,
    name: 'Customer support',
    category: 'Office Help',
    risk: 'Orange',
    count: 3,
    isMonthly: true,
    phases: [
      'Access, shifts and reply rules agreed',
      'Shifts covered with an escalation list',
      'Month-end ticket and response report',
    ],
    suggestedSkills: ['Customer Service', 'Live Chat Support', 'Ticket Resolution', 'Communication'],
  },
  {
    id: 62,
    name: 'Typing & handwritten-to-digital work',
    category: 'Office Help',
    risk: 'Orange',
    count: 2,
    phases: [
      'Scans and output format received',
      'Typed file delivered, one correction pass',
    ],
    suggestedSkills: ['Fast Typing', 'Document Digitization', 'MS Word', 'PDF Formatting'],
  },
  {
    id: 63,
    name: 'App & website testing feedback',
    category: 'Office Help',
    risk: 'Orange',
    count: 3,
    phases: [
      'Access and what to test agreed',
      'Testing done, issues logged with screenshots',
      'Report walked through with the client',
    ],
    suggestedSkills: ['User Testing', 'Bug Logging', 'App Feedback', 'Usability Testing'],
  },
  {
    id: 64,
    name: 'Comment & community moderation',
    category: 'Office Help',
    risk: 'Orange',
    count: 3,
    isMonthly: true,
    phases: [
      'Access and moderation rules agreed',
      'Daily watching through the month',
      'Month-end report of removals and issues',
    ],
    suggestedSkills: ['Community Moderation', 'Discord Moderation', 'Telegram Moderation', 'Spam Control'],
  },

  // 13. Gaming
  {
    id: 65,
    name: 'Game coaching & montages',
    category: 'Gaming',
    risk: 'Green',
    count: 3,
    phases: [
      'Rank, goal and game agreed',
      'Review of recorded gameplay',
      'Coaching sessions and montage delivered',
    ],
    suggestedSkills: ['Game Coaching', 'Montage Editing', 'Gameplay Analysis', 'Valorant/BGMI/CS'],
  },
  {
    id: 66,
    name: 'Discord & gaming server setup',
    category: 'Gaming',
    risk: 'Green',
    count: 4,
    isMonthly: true,
    phases: [
      'Purpose, channels and roles agreed',
      'Server built with bots and permissions',
      'Owner walkthrough and changes',
      'Handover with a moderation guide',
    ],
    suggestedSkills: ['Discord Setup', 'Bot Integration', 'Channel Architecture', 'Server Roles'],
  },

  // 14. Fun & Festivals
  {
    id: 67,
    name: 'Meme making',
    category: 'Fun & Festivals',
    risk: 'Green',
    count: 2,
    phases: [
      'Brand voice and topic given',
      'Set delivered with one revision',
    ],
    suggestedSkills: ['Meme Marketing', 'Trend Jacking', 'Photoshop', 'Viral Content'],
  },
  {
    id: 68,
    name: 'Festival post & reel packs',
    category: 'Fun & Festivals',
    risk: 'Green',
    count: 3,
    phases: [
      'Festival, brand kit and count agreed',
      'Two samples for approval',
      'Full pack in every size',
    ],
    suggestedSkills: ['Festival Creatives', 'Graphic Design', 'Social Media Packs', 'Canva'],
  },

  // 15. School & College Work
  {
    id: 69,
    name: 'WhatsApp sticker & emoji packs',
    category: 'School & College Work',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Photos and sticker count agreed',
      'Draft set for approval',
      'Final pack, installable',
    ],
    suggestedSkills: ['Sticker Design', 'WhatsApp Stickers', 'Vector Art', 'Custom Emojis'],
  },
  {
    id: 70,
    name: 'Playlist making',
    category: 'School & College Work',
    risk: 'Yellow',
    count: 2,
    phases: [
      'Venue, mood and length given',
      'Playlist delivered with one swap round',
    ],
    suggestedSkills: ['Spotify Curation', 'Music Curation', 'Mood Matching', 'DJ Sets'],
  },
  {
    id: 71,
    name: 'College fest & event creatives',
    category: 'School & College Work',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Event brief, dates and item list',
      'Key visual approved',
      'Every item designed to the list',
      'Print-ready files and the after-movie',
    ],
    suggestedSkills: ['Event Branding', 'Fest Creatives', 'Stage Banners', 'ID Cards & Posters'],
  },
  {
    id: 72,
    name: 'College magazine & newsletter making',
    category: 'School & College Work',
    risk: 'Yellow',
    count: 5,
    phases: [
      'Sections, page count and deadline agreed',
      'Content collected and edited',
      'Layout of the first eight pages approved',
      'Full layout',
      'Proof check and press-ready file',
    ],
    suggestedSkills: ['Adobe InDesign', 'Editorial Design', 'Magazine Layout', 'Typography'],
  },
  {
    id: 73,
    name: 'Project report formatting',
    category: 'School & College Work',
    risk: 'Yellow',
    count: 3,
    phases: [
      'Content received, format chosen (IEEE or APA)',
      'Formatted draft with citations',
      'Final with index and figures',
    ],
    suggestedSkills: ['LaTeX', 'IEEE Format', 'APA Formatting', 'MS Word Academic Layout'],
  },
  {
    id: 74,
    name: 'Project demo video & poster',
    category: 'School & College Work',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Project brief and key points',
      'Poster layout approved',
      'Demo video edited',
      'Final print and screen files',
    ],
    suggestedSkills: ['Project Poster', 'Demo Video', 'Academic Presentation', 'Canva'],
  },

  // 16. Engineering & Drawing
  {
    id: 75,
    name: '2D technical drawing (CAD)',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Measurements, standard and scale agreed',
      'Base drawing for review',
      'Dimensions, sections and annotations',
      'Final in DWG and PDF',
    ],
    suggestedSkills: ['AutoCAD', '2D Drafting', 'Engineering Drawing', 'DWG Export'],
  },
  {
    id: 76,
    name: '3D part modelling (CAD)',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Drawings, material and tolerance agreed',
      'Base model shared',
      'Assembly and detailing',
      'Final with STEP/STL and drawing sheets',
    ],
    suggestedSkills: ['SolidWorks', 'Fusion 360', '3D CAD', 'STL Export', 'Mechanical Design'],
  },
  {
    id: 77,
    name: 'House plans & elevations',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Plot size, needs and local rules received',
      'Floor plan option approved',
      'Elevations and sections drawn',
      'Final drawing set',
    ],
    suggestedSkills: ['Architectural Drawing', 'Floor Plans', 'Elevation Design', 'AutoCAD Architecture'],
  },
  {
    id: 78,
    name: '3D rendering & walkthroughs',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 5,
    phases: [
      'Model, references and camera angles agreed',
      'Draft clay render approved',
      'Materials and lighting',
      'Final high-resolution renders',
      'Walkthrough video and changes',
    ],
    suggestedSkills: ['Blender', '3ds Max', 'V-Ray', 'Lumion', 'Architectural Visualization'],
  },
  {
    id: 79,
    name: 'Circuit board drawing (PCB)',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Circuit requirement and components agreed',
      'Schematic approved',
      'Board layout and routing',
      'Gerber files and BOM handover',
    ],
    suggestedSkills: ['KiCad', 'Eagle PCB', 'Schematic Design', 'Gerber Files', 'Hardware Design'],
  },
  {
    id: 80,
    name: 'Material & cost estimate (BOQ)',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 4,
    phases: [
      'Drawings and rate basis received',
      'Quantity take-off sheet',
      'Rates applied and costed',
      'Final BOQ with assumptions noted',
    ],
    suggestedSkills: ['BOQ Preparation', 'Quantity Estimation', 'Cost Estimation', 'Civil Engineering'],
  },
  {
    id: 81,
    name: 'Engineering simulation (FEA, CFD, MATLAB)',
    category: 'Engineering & Drawing',
    risk: 'Yellow',
    count: 5,
    phases: [
      'Problem, software and boundary conditions agreed',
      'Model set up and meshed',
      'Simulation run',
      'Results validated against expected values',
      'Report with plots and conclusions',
    ],
    suggestedSkills: ['ANSYS', 'MATLAB', 'CFD Simulation', 'FEA Analysis', 'Engineering Modeling'],
  },

  // 17. Health & Medical
  {
    id: 82,
    name: 'Medical content writing',
    category: 'Health & Medical',
    risk: 'Red',
    count: 4,
    phases: [
      'Topic, audience and sources agreed',
      'Outline approved',
      'Full draft with references',
      'Changes and final',
    ],
    suggestedSkills: ['Medical Writing', 'Healthcare Articles', 'PubMed References', 'Health Education'],
  },
  {
    id: 83,
    name: 'Medical illustration & diagrams',
    category: 'Health & Medical',
    risk: 'Red',
    count: 3,
    phases: [
      'Subject and reference material agreed',
      'Sketch approved',
      'Final figure, labelled and print-ready',
    ],
    suggestedSkills: ['Anatomy Illustration', 'Biological Diagrams', 'Scientific Art', 'Vector Diagrams'],
  },
  {
    id: 84,
    name: 'Research paper formatting (journal format)',
    category: 'Health & Medical',
    risk: 'Red',
    count: 3,
    phases: [
      'Manuscript and target journal received',
      'Formatted to the journal\'s template',
      'References checked, submission-ready file',
    ],
    suggestedSkills: ['Journal Formatting', 'Manuscript Preparation', 'Citation Management', 'PubMed/Springer'],
  },
  {
    id: 85,
    name: 'Clinic page & appointment content',
    category: 'Health & Medical',
    risk: 'Red',
    count: 3,
    phases: [
      'Services, doctors and details collected',
      'Draft page content',
      'Final after changes',
    ],
    suggestedSkills: ['Doctor Profile Content', 'Clinic Copywriting', 'Patient FAQs', 'Healthcare Pages'],
  },

  // 18. Finance & Accounts
  {
    id: 86,
    name: 'Tally & Zoho data entry',
    category: 'Finance & Accounts',
    risk: 'Red',
    count: 3,
    isMonthly: true,
    phases: [
      'Access and voucher batch agreed',
      'Entries posted',
      'Reconciled, report shared',
    ],
    suggestedSkills: ['TallyPrime', 'Zoho Books', 'Voucher Entry', 'Accounting', 'Bank Reconciliation'],
  },
  {
    id: 87,
    name: 'Invoice & billing setup',
    category: 'Finance & Accounts',
    risk: 'Red',
    count: 3,
    phases: [
      'Billing needs and GST details agreed',
      'Format built with a sample invoice',
      'Delivered with a tracking sheet and how-to',
    ],
    suggestedSkills: ['Invoice Design', 'Billing Template', 'GST Invoices', 'Excel Invoicing'],
  },
  {
    id: 88,
    name: 'Money projection sheet (financial model)',
    category: 'Finance & Accounts',
    risk: 'Red',
    count: 4,
    phases: [
      'Business model and assumptions agreed',
      'Structure of the sheet approved',
      'Three-year model built',
      'Walkthrough and editable file',
    ],
    suggestedSkills: ['Financial Modeling', 'Cash Flow Projections', 'P&L Model', 'Excel Valuation'],
  },
  {
    id: 89,
    name: 'Business plan writing',
    category: 'Finance & Accounts',
    risk: 'Red',
    count: 5,
    phases: [
      'Business, purpose and audience agreed',
      'Outline approved',
      'Market and operations sections',
      'Financial section',
      'Review, design, final document',
    ],
    suggestedSkills: ['Business Plan', 'Executive Summary', 'Market Analysis', 'Financial Summary'],
  },

  // 19. Arts & Stories
  {
    id: 90,
    name: 'Script & story writing',
    category: 'Arts & Stories',
    risk: 'Green',
    count: 4,
    phases: [
      'Idea, length and format agreed',
      'One-page synopsis approved',
      'Full first draft',
      'One rewrite, final in standard format',
    ],
    suggestedSkills: ['Scriptwriting', 'Screenplay', 'Dialogue Writing', 'Storytelling', 'Fiction'],
  },
  {
    id: 91,
    name: 'Storyboarding',
    category: 'Arts & Stories',
    risk: 'Green',
    count: 3,
    phases: [
      'Script and shot count agreed',
      'Rough frames for approval',
      'Final board with camera and action notes',
    ],
    suggestedSkills: ['Storyboarding', 'Visual Narrative', 'Scene Composition', 'Director Notes'],
  },
  {
    id: 92,
    name: 'Research & summary writing',
    category: 'Arts & Stories',
    risk: 'Green',
    count: 3,
    phases: [
      'Question and sources agreed',
      'Research notes with sources shared',
      'Final summary or brief',
    ],
    suggestedSkills: ['Research Synthesis', 'Executive Summaries', 'Literature Review', 'Topic Deep-Dive'],
  },
  {
    id: 93,
    name: 'Book editing & layout (manuscript formatting)',
    category: 'Arts & Stories',
    risk: 'Green',
    count: 5,
    phases: [
      'Manuscript read, edit level agreed',
      'Structural notes to the author',
      'Line edit done',
      'Interior layout',
      'Proof check, print and ebook files',
    ],
    suggestedSkills: ['Book Formatting', 'Manuscript Editing', 'Kindle/Epub', 'Typography', 'InDesign'],
  },
]

export const CATEGORIES_LIST: string[] = Array.from(
  new Set(SKILLS_CATALOGUE.map((s) => s.category))
)

export function getSkillsByCategory(category: string): SkillItem[] {
  if (!category) return []
  const catLower = category.toLowerCase().trim()
  return SKILLS_CATALOGUE.filter((s) => s.category.toLowerCase().trim() === catLower)
}

export function getSkillByName(name: string): SkillItem | undefined {
  if (!name) return undefined
  const nameLower = name.toLowerCase().trim()
  return SKILLS_CATALOGUE.find((s) => s.name.toLowerCase().trim() === nameLower)
}

export function getDefaultPhases(skillName?: string | null, category?: string | null): string[] {
  if (skillName) {
    const s = getSkillByName(skillName)
    if (s && s.phases && s.phases.length > 0) return [...s.phases]
    const lower = skillName.toLowerCase().trim()
    const partial = SKILLS_CATALOGUE.find(
      (item) => item.name.toLowerCase().includes(lower) || lower.includes(item.name.toLowerCase())
    )
    if (partial && partial.phases && partial.phases.length > 0) return [...partial.phases]
  }
  if (category) {
    const catSkills = getSkillsByCategory(category)
    if (catSkills.length > 0 && catSkills[0].phases && catSkills[0].phases.length > 0) {
      return [...catSkills[0].phases]
    }
  }
  return [
    'Phase 1: Project kickoff & brief locked',
    'Phase 2: Core development & interim review',
    'Phase 3: Final delivery, revisions and handover',
  ]
}
