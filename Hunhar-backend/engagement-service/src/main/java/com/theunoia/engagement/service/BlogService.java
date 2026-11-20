package com.theunoia.engagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.JwtUtils;
import com.theunoia.engagement.domain.BlogEditor;
import com.theunoia.engagement.domain.BlogPost;
import com.theunoia.engagement.repository.BlogEditorRepository;
import com.theunoia.engagement.repository.BlogPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Blog articles: public reading (website, sitemap.xml, llms.txt) and writing from the separate blog dashboard.
 * Writers sign in with a blog-editor account (role EDITOR); platform admins can also manage posts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlogService {

    private static final Pattern SLUG = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    private static final Pattern IMAGE_URL = Pattern.compile("^(https://[^\\s\"'<>]{4,490}|/api/v1/projects/files/[0-9a-fA-F-]{36})$");
    private static final int MAX_FAILED_LOGINS = 5;

    private final BlogPostRepository postRepository;
    private final BlogEditorRepository editorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper;

    @Value("${theunoia.site.url:https://www.hunhar.in}")
    private String siteUrl;

    // ------------------------------------------------------------------ reading

    @Transactional(readOnly = true)
    public List<Map<String, Object>> publishedPosts() {
        return postRepository.findByStatusOrderByPublishedAtDesc(BlogPost.Status.PUBLISHED).stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> publishedPost(String slug) {
        return postRepository.findBySlug(slug)
                .filter(p -> p.getStatus() == BlogPost.Status.PUBLISHED)
                .map(this::view)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> allPosts() {
        return postRepository.findAllByOrderByUpdatedAtDesc().stream().map(this::view).toList();
    }

    /** Same shape as the website's BlogPost type. */
    private Map<String, Object> view(BlogPost p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("slug", p.getSlug());
        m.put("title", p.getTitle());
        m.put("excerpt", p.getExcerpt() == null ? "" : p.getExcerpt());
        m.put("content", p.getContent());
        m.put("coverImage", p.getCoverImage() == null ? "" : p.getCoverImage());
        m.put("category", p.getCategory() == null ? "General" : p.getCategory());
        m.put("tags", splitTags(p.getTags()));
        Map<String, Object> author = new LinkedHashMap<>();
        author.put("name", p.getAuthorName() == null ? "Hunhar Editorial Team" : p.getAuthorName());
        author.put("role", p.getAuthorRole() == null ? "" : p.getAuthorRole());
        author.put("avatar", p.getAuthorAvatar() == null ? "" : p.getAuthorAvatar());
        m.put("author", author);
        m.put("publishedAt", p.getPublishedAt() != null ? p.getPublishedAt() : p.getCreatedAt());
        m.put("updatedAt", p.getUpdatedAt());
        m.put("readTime", p.getReadTime());
        m.put("status", p.getStatus() == BlogPost.Status.PUBLISHED ? "published" : "draft");
        m.put("metaTitle", p.getMetaTitle());
        m.put("metaDescription", p.getMetaDescription());
        m.put("focusKeyword", p.getFocusKeyword());
        m.put("featured", p.isFeatured());
        return m;
    }

    // ------------------------------------------------------------------ writing

    @Transactional
    public Map<String, Object> save(Map<String, Object> in, String savedBy) {
        String id = str(in.get("id"));
        BlogPost p = id.isEmpty() ? new BlogPost()
                : postRepository.findById(UUID.fromString(id)).orElseThrow(() -> new ResourceNotFoundException("Article not found"));

        String title = str(in.get("title"));
        if (title.length() < 5 || title.length() > 200) throw new BadRequestException("Title must be 5-200 characters");
        String content = str(in.get("content"));
        if (content.length() < 50) throw new BadRequestException("Please write at least a few sentences of content");
        if (content.length() > 200_000) throw new BadRequestException("The article is too long");

        String slug = str(in.get("slug")).toLowerCase(Locale.ROOT);
        if (slug.isEmpty()) slug = slugify(title);
        if (!SLUG.matcher(slug).matches() || slug.length() > 160) {
            throw new BadRequestException("URL slug can only use lowercase letters, numbers and dashes");
        }
        boolean taken = p.getId() == null ? postRepository.existsBySlug(slug) : postRepository.existsBySlugAndIdNot(slug, p.getId());
        if (taken) throw new BadRequestException("Another article already uses the URL /blog/" + slug);

        String cover = str(in.get("coverImage"));
        if (!cover.isEmpty() && !IMAGE_URL.matcher(cover).matches()) {
            throw new BadRequestException("Cover image must be an https:// link or an uploaded image");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> author = in.get("author") instanceof Map<?, ?> a ? (Map<String, Object>) a : Map.of();
        String avatar = str(author.get("avatar"));
        if (!avatar.isEmpty() && !IMAGE_URL.matcher(avatar).matches()) avatar = "";

        boolean publish = "published".equalsIgnoreCase(str(in.get("status")));
        p.setTitle(title);
        p.setSlug(slug);
        p.setExcerpt(clip(str(in.get("excerpt")), 600));
        p.setContent(content);
        p.setCoverImage(cover.isEmpty() ? null : cover);
        p.setCategory(clip(str(in.get("category")), 80));
        p.setTags(joinTags(in.get("tags")));
        p.setAuthorName(clip(str(author.get("name")), 100));
        p.setAuthorRole(clip(str(author.get("role")), 100));
        p.setAuthorAvatar(avatar.isEmpty() ? null : avatar);
        p.setMetaTitle(clip(str(in.get("metaTitle")), 200));
        p.setMetaDescription(clip(str(in.get("metaDescription")), 320));
        p.setFocusKeyword(clip(str(in.get("focusKeyword")), 120));
        p.setFeatured(Boolean.TRUE.equals(in.get("featured")));
        p.setReadTime(readTime(content));
        p.setStatus(publish ? BlogPost.Status.PUBLISHED : BlogPost.Status.DRAFT);
        if (publish && p.getPublishedAt() == null) p.setPublishedAt(Instant.now());
        p.setUpdatedBy(clip(savedBy, 120));
        // Only one featured article at a time
        if (p.isFeatured()) {
            postRepository.findAll().stream().filter(o -> o.isFeatured() && !o.getId().equals(p.getId())).forEach(o -> {
                o.setFeatured(false);
                postRepository.save(o);
            });
        }
        return view(postRepository.save(p));
    }

    @Transactional
    public void delete(UUID id) {
        BlogPost p = postRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        postRepository.delete(p);
    }

    // ------------------------------------------------------------------ editors

    @Transactional(noRollbackFor = UnauthorizedException.class)
    public Map<String, Object> login(String email, String password) {
        BlogEditor e = editorRepository.findByEmailIgnoreCase(str(email))
                .filter(BlogEditor::isActive)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (e.getLockedUntil() != null && e.getLockedUntil().isAfter(Instant.now())) {
            throw new UnauthorizedException("Too many wrong passwords. Try again in 15 minutes.");
        }
        if (password == null || !passwordEncoder.matches(password, e.getPasswordHash())) {
            e.setFailedLogins(e.getFailedLogins() + 1);
            if (e.getFailedLogins() >= MAX_FAILED_LOGINS) {
                e.setLockedUntil(Instant.now().plus(Duration.ofMinutes(15)));
                e.setFailedLogins(0);
            }
            editorRepository.save(e);
            throw new UnauthorizedException("Invalid email or password");
        }
        e.setFailedLogins(0);
        e.setLockedUntil(null);
        e.setLastLoginAt(Instant.now());
        editorRepository.save(e);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("token", jwtUtils.generateToken(e.getId(), e.getEmail(), "EDITOR", "ACTIVE"));
        m.put("userId", e.getId());
        m.put("email", e.getEmail());
        m.put("fullName", e.getName());
        m.put("role", "EDITOR");
        return m;
    }

    /** A still-valid token is not enough: the editor account must still be active. */
    @Transactional(readOnly = true)
    public BlogEditor activeEditor(UUID id) {
        return editorRepository.findById(id).filter(BlogEditor::isActive)
                .orElseThrow(() -> new UnauthorizedException("Your blog editor account is not active"));
    }

    // ------------------------------------------------------------------ SEO files

    /** sitemap.xml for Google: the public pages plus every published article. */
    @Transactional(readOnly = true)
    public String sitemapXml() {
        String base = siteUrl.replaceAll("/$", "");
        StringBuilder sb = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        String[][] pages = {
                {"/", "1.0", "weekly"}, {"/about", "0.8", "monthly"}, {"/features", "0.8", "monthly"},
                {"/blog", "0.9", "daily"}, {"/contact", "0.6", "yearly"}, {"/signup", "0.7", "yearly"},
                {"/terms", "0.3", "yearly"}, {"/privacy", "0.3", "yearly"}, {"/refund-policy", "0.3", "yearly"}};
        for (String[] pg : pages) {
            sb.append("  <url><loc>").append(base).append(pg[0]).append("</loc><changefreq>").append(pg[2])
                    .append("</changefreq><priority>").append(pg[1]).append("</priority></url>\n");
        }
        DateTimeFormatter day = DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneOffset.UTC);
        for (BlogPost p : postRepository.findByStatusOrderByPublishedAtDesc(BlogPost.Status.PUBLISHED)) {
            Instant mod = p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getPublishedAt();
            sb.append("  <url><loc>").append(base).append("/blog/").append(xml(p.getSlug())).append("</loc>");
            if (mod != null) sb.append("<lastmod>").append(day.format(mod)).append("</lastmod>");
            sb.append("<changefreq>monthly</changefreq><priority>0.7</priority></url>\n");
        }
        return sb.append("</urlset>\n").toString();
    }

    /** llms.txt (llmstxt.org): a plain summary of the site and its articles for AI assistants and crawlers. */
    @Transactional(readOnly = true)
    public String llmsTxt() {
        String base = siteUrl.replaceAll("/$", "");
        StringBuilder sb = new StringBuilder();
        sb.append("# Hunhar\n\n")
                .append("> Hunhar (hunhar.in) is an Indian marketplace where businesses hire verified college students and ")
                .append("freelancers for design, development, marketing and content projects. Clients post projects, ")
                .append("freelancers send proposals, and payments are held in milestone escrow until the work is approved.\n\n")
                .append("## Main pages\n\n")
                .append("- [Home](").append(base).append("/): What Hunhar is and how hiring works\n")
                .append("- [About](").append(base).append("/about): The team and mission behind Hunhar\n")
                .append("- [Features](").append(base).append("/features): Milestone escrow, verified talent, chat, invoices and more\n")
                .append("- [Blog](").append(base).append("/blog): Guides for freelancers, students and hiring teams\n")
                .append("- [Contact](").append(base).append("/contact): Support and business enquiries\n\n")
                .append("## How it works\n\n")
                .append("- Clients post a project with a budget and timeline; freelancers send proposals using bid credits.\n")
                .append("- After hiring, the client funds each milestone; money is released when the work is approved.\n")
                .append("- Freelancers verify identity (Aadhaar, college ID, skills) and withdraw earnings to UPI or a bank account.\n\n");
        List<BlogPost> posts = postRepository.findByStatusOrderByPublishedAtDesc(BlogPost.Status.PUBLISHED);
        if (!posts.isEmpty()) {
            sb.append("## Articles\n\n");
            for (BlogPost p : posts) {
                sb.append("- [").append(oneLine(p.getTitle())).append("](").append(base).append("/blog/").append(p.getSlug()).append(")");
                if (p.getExcerpt() != null && !p.getExcerpt().isBlank()) sb.append(": ").append(oneLine(p.getExcerpt()));
                sb.append("\n");
            }
            sb.append("\n");
        }
        sb.append("## Optional\n\n")
                .append("- [Terms of Service](").append(base).append("/terms)\n")
                .append("- [Privacy Policy](").append(base).append("/privacy)\n")
                .append("- [Refund Policy](").append(base).append("/refund-policy)\n");
        return sb.toString();
    }

    // ------------------------------------------------------------------ first run

    /** The first time the blog runs, load the articles that were written in the Hunhar-blog project. */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (postRepository.count() > 0) return;
        try (InputStream in = new ClassPathResource("blog-seed.json").getInputStream()) {
            JsonNode arr = objectMapper.readTree(in);
            int n = 0;
            for (JsonNode j : arr) {
                BlogPost p = BlogPost.builder()
                        .slug(j.path("slug").asText())
                        .title(j.path("title").asText())
                        .excerpt(clip(j.path("excerpt").asText(""), 600))
                        .content(j.path("content").asText())
                        .coverImage(j.path("coverImage").asText(null))
                        .category(j.path("category").asText(null))
                        .tags(String.join(",", objectMapper.convertValue(j.path("tags"), String[].class)))
                        .authorName(j.path("author").path("name").asText(null))
                        .authorRole(j.path("author").path("role").asText(null))
                        .authorAvatar(j.path("author").path("avatar").asText(null))
                        .status("published".equals(j.path("status").asText()) ? BlogPost.Status.PUBLISHED : BlogPost.Status.DRAFT)
                        .publishedAt(Instant.parse(j.path("publishedAt").asText()))
                        .readTime(j.path("readTime").asText(null))
                        .metaTitle(j.path("metaTitle").asText(null))
                        .metaDescription(j.path("metaDescription").asText(null))
                        .focusKeyword(j.path("focusKeyword").asText(null))
                        .featured(j.path("featured").asBoolean(false))
                        .updatedBy("seed")
                        .build();
                postRepository.save(p);
                n++;
            }
            log.info("Blog: loaded {} starter article(s)", n);
        } catch (Exception e) {
            log.warn("Blog: could not load starter articles: {}", e.getMessage());
        }
    }

    // ------------------------------------------------------------------ helpers

    static String slugify(String title) {
        String s = title.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", "").trim().replaceAll("[\\s_-]+", "-");
        s = s.replaceAll("^-+|-+$", "");
        return s.length() > 160 ? s.substring(0, 160).replaceAll("-+$", "") : s;
    }

    static String readTime(String content) {
        int words = content.replaceAll("<[^>]*>", " ").trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / 200.0)) + " min read";
    }

    private static List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(t -> !t.isEmpty()).toList();
    }

    private static String joinTags(Object raw) {
        List<String> list = new ArrayList<>();
        if (raw instanceof Collection<?> c) c.forEach(t -> list.add(String.valueOf(t)));
        else if (raw != null) list.addAll(Arrays.asList(String.valueOf(raw).split(",")));
        String joined = String.join(",", list.stream().map(t -> t.replace(",", " ").trim()).filter(t -> !t.isEmpty() && t.length() <= 40)
                .distinct().limit(12).toList());
        return joined.length() > 500 ? joined.substring(0, 500) : joined;
    }

    private static String str(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }

    private static String clip(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String oneLine(String s) {
        return s.replaceAll("[\\r\\n]+", " ").trim();
    }

    private static String xml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
