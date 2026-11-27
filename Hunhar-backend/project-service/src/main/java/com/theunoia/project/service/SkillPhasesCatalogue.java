package com.theunoia.project.service;

import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Hunhar — Launch Skill Phases Catalogue (93 Skills, 315 Phases)
 * Reference: THEUNOiA LLP (Hunhar) Official Specification (12 November 2026)
 */
@Component
public class SkillPhasesCatalogue {

    public record SkillDef(
            int id,
            String name,
            String category,
            int count,
            boolean isMonthly,
            String risk,
            List<String> phases
    ) {}

    private static final List<SkillDef> ALL_SKILLS = new ArrayList<>();
    private static final Map<Integer, SkillDef> BY_ID = new HashMap<>();
    private static final Map<String, SkillDef> BY_NAME_LOWER = new HashMap<>();
    private static final Map<String, List<SkillDef>> BY_CATEGORY = new HashMap<>();

    static {
        addSkill(1, "Website development", "Websites & Apps", 5, false, "Orange", List.of("Brief, sitemap and tech stack locked", "Page designs or template approved", "Front-end built on a staging link", "Back-end, forms and testing", "Live deploy, handover, 7-day fix window"));
        addSkill(2, "Website page coding (front-end)", "Websites & Apps", 4, false, "Orange", List.of("Design files and browser list received", "Desktop layout coded", "Mobile and tablet made responsive", "Cross-browser check, code handover"));
        addSkill(3, "Mobile app development", "Websites & Apps", 5, false, "Orange", List.of("Feature list and platforms locked", "Screens and app flow approved", "Core build — first working version", "Testing and bug fixes on real devices", "Store-ready build plus source handover"));
        addSkill(4, "WordPress & Shopify websites", "Websites & Apps", 4, true, "Orange", List.of("Pages, theme and plugin list agreed", "Theme set up with real content", "Client walkthrough and changes", "Go live, admin handover, backup set"));
        addSkill(5, "Bug fixing & testing", "Websites & Apps", 3, true, "Orange", List.of("Bug reproduced, cause reported", "Fix applied on a copy, shown working", "Client confirms, fix pushed live"));
        addSkill(6, "Automating repeat work (scripts)", "Websites & Apps", 3, false, "Orange", List.of("Current manual steps mapped", "Script built, test run shown", "Deployed with run instructions"));
        addSkill(7, "Online store setup", "Websites & Apps", 4, false, "Orange", List.of("Product list, payment and courier chosen", "Store built with the first 10 products", "Test order run end to end", "Live, with a how-to-add-products video"));
        addSkill(8, "Adding AI to an app or website", "AI", 4, false, "Orange", List.of("Use case, API and monthly budget agreed", "Prototype on one feature", "Full integration with error handling", "Live, with running cost and limits documented"));
        addSkill(9, "Chatbot & WhatsApp bot making", "AI", 4, false, "Orange", List.of("Question list and conversation flow agreed", "Flow built, demo link shared", "Client tests, replies tuned", "Connected to the live number or page"));
        addSkill(10, "AI prompt & workflow setup", "AI", 3, false, "Orange", List.of("Tasks to automate listed", "Prompts and automation built, demo run", "Handover doc plus team walkthrough"));
        addSkill(11, "Tagging data for AI (data labelling)", "AI", 3, false, "Orange", List.of("Labelling rules and sample set agreed", "First batch tagged, accuracy checked", "Full set tagged and delivered"));
        addSkill(12, "Logo design", "Design", 4, false, "Green", List.of("Brand brief and references", "Three concept directions", "Chosen direction refined — colour and type", "Full file pack plus usage sheet"));
        addSkill(13, "Social media post design", "Design", 3, true, "Green", List.of("Brief, brand kit and post list", "Two sample posts for approval", "Full batch delivered in every size"));
        addSkill(14, "App & website screen design (UI/UX)", "Design", 4, false, "Green", List.of("Screen list and user flow agreed", "Wireframes approved", "Visual design of all screens", "Clickable prototype and developer handover"));
        addSkill(15, "Poster & invite design", "Design", 3, false, "Green", List.of("Content, size and style locked", "Draft with two layout options", "Print-ready final files"));
        addSkill(16, "Presentation design", "Design", 4, false, "Green", List.of("Content and slide count received", "Template plus three sample slides", "All slides designed", "Changes and editable file handover"));
        addSkill(17, "YouTube thumbnail design", "Design", 2, false, "Green", List.of("Video, title and reference style given", "Two options delivered, one revision"));
        addSkill(18, "Photo background removal & touch-up", "Design", 2, false, "Green", List.of("Photos and output format received", "Edited set delivered, one correction pass"));
        addSkill(19, "Template making", "Design", 3, false, "Green", List.of("Use case and fields agreed", "Template built with a sample filled in", "Delivered with a short how-to-use note"));
        addSkill(20, "Illustration & drawing", "Art & Gifts", 4, false, "Green", List.of("Brief, style and references", "Rough sketch approved", "Line work and colour", "Final files in every size needed"));
        addSkill(21, "Calligraphy & name art", "Art & Gifts", 3, false, "Green", List.of("Words, style and use agreed", "Draft in two hands", "Final in print and digital formats"));
        addSkill(22, "Portrait & caricature drawing", "Art & Gifts", 3, false, "Green", List.of("Photo and style chosen", "Sketch shown for approval", "Final artwork, print-ready"));
        addSkill(23, "Cartoon-style portraits from photos", "Art & Gifts", 3, false, "Green", List.of("Photo, style and background agreed", "Draft shared for changes", "Final in print and phone sizes"));
        addSkill(24, "Reel direction & concept", "Video", 3, true, "Yellow", List.of("Goal, audience and references", "Hook, script and shot list approved", "Live direction on the shoot day"));
        addSkill(25, "Reels filmed by the student (UGC)", "Video", 4, true, "Yellow", List.of("Brief, product and talking points", "Script and setup approved", "Filming — raw clips shared", "Selected takes delivered, one reshoot"));
        addSkill(26, "Reels & shorts editing", "Video", 3, true, "Yellow", List.of("Footage, style and music received", "First cut for review", "Final with captions, one round of changes"));
        addSkill(27, "YouTube video editing", "Video", 4, true, "Yellow", List.of("Footage and reference style received", "Rough cut — structure only", "Full edit with graphics and sound", "Changes and final export"));
        addSkill(28, "Animation & motion graphics", "Video", 5, false, "Yellow", List.of("Script and style locked", "Storyboard approved", "Design of frames and characters", "Animation first pass", "Sound, changes, final export"));
        addSkill(29, "AI video making", "Video", 4, false, "Yellow", List.of("Script, tool and look agreed", "Ten-second sample test", "Full video generated and assembled", "Changes and final export"));
        addSkill(30, "Birthday & anniversary videos", "Video", 3, false, "Yellow", List.of("Photos, music and message collected", "Draft shared", "Final after one round of changes"));
        addSkill(31, "Voice-over & dubbing", "Audio & Music", 3, false, "Yellow", List.of("Script, tone and one sample line approved", "Full recording delivered", "Retakes and cleaned final audio"));
        addSkill(32, "Music & beat making", "Audio & Music", 4, false, "Yellow", List.of("Reference tracks and mood agreed", "Thirty-second demo loop", "Full track arranged", "Mix, master and stems handover"));
        addSkill(33, "Audio typed out (transcription)", "Audio & Music", 2, false, "Yellow", List.of("Audio and output format received", "Transcript delivered, one correction pass"));
        addSkill(34, "Blog & article writing", "Writing", 3, true, "Yellow", List.of("Topic, angle and outline approved", "Full draft", "One revision, final with image suggestions"));
        addSkill(35, "Writing that ranks on Google (SEO writing)", "Writing", 4, true, "Yellow", List.of("Keyword and topic agreed", "Outline with headings approved", "Full draft written", "On-page SEO — title, meta, links — and final"));
        addSkill(36, "Ad & sales copywriting", "Writing", 3, false, "Yellow", List.of("Product, audience and offer brief", "Three variations for testing", "Chosen one refined, final copy"));
        addSkill(37, "Resume & LinkedIn writing", "Writing", 3, false, "Yellow", List.of("Current profile and target role received", "Rewritten draft", "One revision, final in Word and PDF"));
        addSkill(38, "Manuals & how-to guides (technical writing)", "Writing", 4, false, "Yellow", List.of("Product access and audience agreed", "Structure and contents page approved", "Full draft with screenshots", "Review, changes, final formats"));
        addSkill(39, "Caption & hashtag writing", "Writing", 2, true, "Yellow", List.of("Posts, brand voice and goal given", "Captions and tag sets delivered, one revision"));
        addSkill(40, "Proofreading & grammar check", "Writing", 2, false, "Yellow", List.of("Document and style preference received", "Corrected file with changes marked"));
        addSkill(41, "Study notes making", "Writing", 3, false, "Yellow", List.of("Syllabus, unit and format agreed", "First unit sent for approval", "Full notes delivered"));
        addSkill(42, "Poem & shayari writing", "Speeches & Poems", 2, false, "Green", List.of("Occasion, names and tone given", "Verse delivered with one rewrite"));
        addSkill(43, "Speech & anchoring scripts", "Speeches & Poems", 3, false, "Green", List.of("Event, audience and length agreed", "Draft script", "Final after a read-through and changes"));
        addSkill(44, "Roast & toast writing", "Speeches & Poems", 3, false, "Green", List.of("Person, stories and limits agreed", "Draft", "Final with timing and delivery notes"));
        addSkill(45, "Apology & confession message writing", "Speeches & Poems", 2, false, "Green", List.of("Situation and tone understood", "Message delivered with one rewrite"));
        addSkill(46, "Wedding hashtag & couple name making", "Speeches & Poems", 2, false, "Green", List.of("Names and vibe given", "Ten options delivered, one more round"));
        addSkill(47, "Quiz, trivia & treasure-hunt writing", "Speeches & Poems", 3, false, "Green", List.of("Theme, difficulty and count agreed", "Draft set for review", "Final with answer key and clue placement"));
        addSkill(48, "Social media handling", "Marketing", 4, true, "Orange", List.of("Account access and the month's plan approved", "Content calendar signed off", "Posting and daily replies through the month", "Month-end report and next month's plan"));
        addSkill(49, "Getting found on Google (SEO)", "Marketing", 5, true, "Orange", List.of("Access granted and site audited", "Keyword plan approved", "On-page fixes done", "Content and backlinks through the month", "Monthly ranking report"));
        addSkill(50, "Google & Meta ads", "Marketing", 4, true, "Orange", List.of("Access, budget and goal agreed", "Campaigns built and launched", "Weekly watching and adjusting", "Month-end spend and result report"));
        addSkill(51, "Email marketing & leads", "Marketing", 4, true, "Orange", List.of("Audience and offer agreed", "List built or cleaned", "Mails written and scheduled", "Send report — opens, clicks, leads"));
        addSkill(52, "Influencer outreach", "Marketing", 3, true, "Orange", List.of("Brief, budget and creator type agreed", "Shortlist with rates shared", "Outreach done, replies handed over"));
        addSkill(53, "Instagram bio & profile glow-up", "Marketing", 3, false, "Orange", List.of("Current profile and goal reviewed", "Bio, name and highlight plan shared", "Covers delivered and profile set up"));
        addSkill(54, "Translation & subtitles", "Languages", 3, true, "Yellow", List.of("File, language pair and tone agreed", "Translation first pass", "Review, timing sync, final file"));
        addSkill(55, "Regional language content", "Languages", 3, false, "Yellow", List.of("Topic, language and audience agreed", "Draft script or copy", "Final after changes"));
        addSkill(56, "Data entry", "Data & Research", 2, true, "Orange", List.of("Source files and format agreed", "Entered sheet delivered, one correction pass"));
        addSkill(57, "Excel & data reports", "Data & Research", 3, false, "Orange", List.of("Raw data and the questions received", "Cleaned data plus draft sheet", "Final with charts and a short read-out"));
        addSkill(58, "Market research", "Data & Research", 3, false, "Orange", List.of("Questions and competitor list agreed", "Data collected in a sheet", "Findings summary delivered"));
        addSkill(59, "Virtual assistant", "Office Help", 3, true, "Orange", List.of("Tasks, hours and access agreed", "Weekly work against a shared task list", "Month-end summary of hours and work done"));
        addSkill(60, "Accounts & GST work", "Office Help", 4, true, "Orange", List.of("Access, books and period agreed", "Entries posted", "Reconciliation and returns prepped", "Handed to the client or their CA to file"));
        addSkill(61, "Customer support", "Office Help", 3, true, "Orange", List.of("Access, shifts and reply rules agreed", "Shifts covered with an escalation list", "Month-end ticket and response report"));
        addSkill(62, "Typing & handwritten-to-digital work", "Office Help", 2, false, "Orange", List.of("Scans and output format received", "Typed file delivered, one correction pass"));
        addSkill(63, "App & website testing feedback", "Office Help", 3, false, "Orange", List.of("Access and what to test agreed", "Testing done, issues logged with screenshots", "Report walked through with the client"));
        addSkill(64, "Comment & community moderation", "Office Help", 3, true, "Orange", List.of("Access and moderation rules agreed", "Daily watching through the month", "Month-end report of removals and issues"));
        addSkill(65, "Game coaching & montages", "Gaming", 3, false, "Green", List.of("Rank, goal and game agreed", "Review of recorded gameplay", "Coaching sessions and montage delivered"));
        addSkill(66, "Discord & gaming server setup", "Gaming", 4, true, "Green", List.of("Purpose, channels and roles agreed", "Server built with bots and permissions", "Owner walkthrough and changes", "Handover with a moderation guide"));
        addSkill(67, "Meme making", "Fun & Festivals", 2, false, "Green", List.of("Brand voice and topic given", "Set delivered with one revision"));
        addSkill(68, "Festival post & reel packs", "Fun & Festivals", 3, false, "Green", List.of("Festival, brand kit and count agreed", "Two samples for approval", "Full pack in every size"));
        addSkill(69, "WhatsApp sticker & emoji packs", "School & College Work", 3, false, "Yellow", List.of("Photos and sticker count agreed", "Draft set for approval", "Final pack, installable"));
        addSkill(70, "Playlist making", "School & College Work", 2, false, "Yellow", List.of("Venue, mood and length given", "Playlist delivered with one swap round"));
        addSkill(71, "College fest & event creatives", "School & College Work", 4, false, "Yellow", List.of("Event brief, dates and item list", "Key visual approved", "Every item designed to the list", "Print-ready files and the after-movie"));
        addSkill(72, "College magazine & newsletter making", "School & College Work", 5, false, "Yellow", List.of("Sections, page count and deadline agreed", "Content collected and edited", "Layout of the first eight pages approved", "Full layout", "Proof check and press-ready file"));
        addSkill(73, "Project report formatting", "School & College Work", 3, false, "Yellow", List.of("Content received, format chosen (IEEE or APA)", "Formatted draft with citations", "Final with index and figures"));
        addSkill(74, "Project demo video & poster", "School & College Work", 4, false, "Yellow", List.of("Project brief and key points", "Poster layout approved", "Demo video edited", "Final print and screen files"));
        addSkill(75, "2D technical drawing (CAD)", "Engineering & Drawing", 4, false, "Yellow", List.of("Measurements, standard and scale agreed", "Base drawing for review", "Dimensions, sections and annotations", "Final in DWG and PDF"));
        addSkill(76, "3D part modelling (CAD)", "Engineering & Drawing", 4, false, "Yellow", List.of("Drawings, material and tolerance agreed", "Base model shared", "Assembly and detailing", "Final with STEP/STL and drawing sheets"));
        addSkill(77, "House plans & elevations", "Engineering & Drawing", 4, false, "Yellow", List.of("Plot size, needs and local rules received", "Floor plan option approved", "Elevations and sections drawn", "Final drawing set"));
        addSkill(78, "3D rendering & walkthroughs", "Engineering & Drawing", 5, false, "Yellow", List.of("Model, references and camera angles agreed", "Draft clay render approved", "Materials and lighting", "Final high-resolution renders", "Walkthrough video and changes"));
        addSkill(79, "Circuit board drawing (PCB)", "Engineering & Drawing", 4, false, "Yellow", List.of("Circuit requirement and components agreed", "Schematic approved", "Board layout and routing", "Gerber files and BOM handover"));
        addSkill(80, "Material & cost estimate (BOQ)", "Engineering & Drawing", 4, false, "Yellow", List.of("Drawings and rate basis received", "Quantity take-off sheet", "Rates applied and costed", "Final BOQ with assumptions noted"));
        addSkill(81, "Engineering simulation (FEA, CFD, MATLAB)", "Engineering & Drawing", 5, false, "Yellow", List.of("Problem, software and boundary conditions agreed", "Model set up and meshed", "Simulation run", "Results validated against expected values", "Report with plots and conclusions"));
        addSkill(82, "Medical content writing", "Health & Medical", 4, false, "Red", List.of("Topic, audience and sources agreed", "Outline approved", "Full draft with references", "Changes and final"));
        addSkill(83, "Medical illustration & diagrams", "Health & Medical", 3, false, "Red", List.of("Subject and reference material agreed", "Sketch approved", "Final figure, labelled and print-ready"));
        addSkill(84, "Research paper formatting (journal format)", "Health & Medical", 3, false, "Red", List.of("Manuscript and target journal received", "Formatted to the journal's template", "References checked, submission-ready file"));
        addSkill(85, "Clinic page & appointment content", "Health & Medical", 3, false, "Red", List.of("Services, doctors and details collected", "Draft page content", "Final after changes"));
        addSkill(86, "Tally & Zoho data entry", "Finance & Accounts", 3, true, "Red", List.of("Access and voucher batch agreed", "Entries posted", "Reconciled, report shared"));
        addSkill(87, "Invoice & billing setup", "Finance & Accounts", 3, false, "Red", List.of("Billing needs and GST details agreed", "Format built with a sample invoice", "Delivered with a tracking sheet and how-to"));
        addSkill(88, "Money projection sheet (financial model)", "Finance & Accounts", 4, false, "Red", List.of("Business model and assumptions agreed", "Structure of the sheet approved", "Three-year model built", "Walkthrough and editable file"));
        addSkill(89, "Business plan writing", "Finance & Accounts", 5, false, "Red", List.of("Business, purpose and audience agreed", "Outline approved", "Market and operations sections", "Financial section", "Review, design, final document"));
        addSkill(90, "Script & story writing", "Arts & Stories", 4, false, "Green", List.of("Idea, length and format agreed", "One-page synopsis approved", "Full first draft", "One rewrite, final in standard format"));
        addSkill(91, "Storyboarding", "Arts & Stories", 3, false, "Green", List.of("Script and shot count agreed", "Rough frames for approval", "Final board with camera and action notes"));
        addSkill(92, "Research & summary writing", "Arts & Stories", 3, false, "Green", List.of("Question and sources agreed", "Research notes with sources shared", "Final summary or brief"));
        addSkill(93, "Book editing & layout (manuscript formatting)", "Arts & Stories", 5, false, "Green", List.of("Manuscript read, edit level agreed", "Structural notes to the author", "Line edit done", "Interior layout", "Proof check, print and ebook files"));
    }

    private static void addSkill(int id, String name, String category, int count, boolean isMonthly, String risk, List<String> phases) {
        SkillDef def = new SkillDef(id, name, category, count, isMonthly, risk, phases);
        ALL_SKILLS.add(def);
        BY_ID.put(id, def);
        BY_NAME_LOWER.put(name.toLowerCase().trim(), def);
        BY_CATEGORY.computeIfAbsent(category.toLowerCase().trim(), k -> new ArrayList<>()).add(def);
    }

    public static List<SkillDef> getAllSkills() {
        return Collections.unmodifiableList(ALL_SKILLS);
    }

    public static Optional<SkillDef> getById(int id) {
        return Optional.ofNullable(BY_ID.get(id));
    }

    public static Optional<SkillDef> getByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        return Optional.ofNullable(BY_NAME_LOWER.get(name.toLowerCase().trim()));
    }

    public static List<SkillDef> getByCategory(String category) {
        if (category == null || category.isBlank()) return Collections.emptyList();
        return BY_CATEGORY.getOrDefault(category.toLowerCase().trim(), Collections.emptyList());
    }

    /**
     * Best-effort match by subcategory, title, or category to find the matching SkillDef
     */
    public static Optional<SkillDef> findBestMatch(String query) {
        if (query == null || query.isBlank()) return Optional.empty();
        String q = query.toLowerCase().trim();
        if (BY_NAME_LOWER.containsKey(q)) {
            return Optional.of(BY_NAME_LOWER.get(q));
        }
        for (SkillDef def : ALL_SKILLS) {
            String defName = def.name().toLowerCase();
            if (q.contains(defName) || defName.contains(q)) {
                return Optional.of(def);
            }
        }
        return Optional.empty();
    }

    /**
     * Returns the exact official phases for a given skill / project context.
     * Guaranteed to never return an empty list.
     */
    public static List<String> getPhasesForSkill(String subCategory, String category, String title) {
        if (subCategory != null && !subCategory.isBlank()) {
            Optional<SkillDef> match = findBestMatch(subCategory);
            if (match.isPresent() && !match.get().phases().isEmpty()) return match.get().phases();
        }

        if (title != null && !title.isBlank()) {
            Optional<SkillDef> match = findBestMatch(title);
            if (match.isPresent() && !match.get().phases().isEmpty()) return match.get().phases();
        }

        if (category != null && !category.isBlank()) {
            List<SkillDef> catSkills = getByCategory(category);
            if (!catSkills.isEmpty() && !catSkills.get(0).phases().isEmpty()) {
                return catSkills.get(0).phases();
            }
        }

        return List.of(
                "1. Project kickoff & brief agreed",
                "2. Core build & review checkpoint",
                "3. Final delivery, changes & handover"
        );
    }
}
