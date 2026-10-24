package com.theunoia.content.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.content.domain.ContentEntities.BlogCategory;
import com.theunoia.content.domain.ContentEntities.BlogPost;
import com.theunoia.content.domain.ContentEntities.ContactInquiry;
import com.theunoia.content.domain.ContentEntities.Faq;
import com.theunoia.content.domain.ContentEntities.Lead;
import com.theunoia.content.domain.ContentEntities.Page;
import com.theunoia.content.domain.ContentEntities.Seo;
import com.theunoia.content.repository.ContentRepositories.BlogCategoryRepository;
import com.theunoia.content.repository.ContentRepositories.BlogPostRepository;
import com.theunoia.content.repository.ContentRepositories.FaqRepository;
import com.theunoia.content.repository.ContentRepositories.InquiryRepository;
import com.theunoia.content.repository.ContentRepositories.LeadRepository;
import com.theunoia.content.repository.ContentRepositories.PageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final PageRepository pages;
    private final BlogCategoryRepository categories;
    private final BlogPostRepository posts;
    private final FaqRepository faqs;
    private final InquiryRepository inquiries;
    private final LeadRepository leads;
    private final NamedParameterJdbcTemplate jdbc;
    private final EventPublisher events;

    @Value("${theunoia.content.site-url:https://theunoia.com}")
    private String siteUrl;

    public record PostCommand(String title, String slug, String excerpt, String content, String coverImageUrl, UUID categoryId,
                              String authorName, boolean publish, List<String> tags, Seo seo) {
    }

    public record PageCommand(String slug, String title, String type, List<Map<String, Object>> sections, boolean publish, Seo seo) {
    }

    // ------------------------------------------------------------------ pages

    @Transactional(readOnly = true)
    public Page page(String slug) {
        return pages.findBySlug(slug).filter(p -> "PUBLISHED".equals(p.getStatus())).orElseThrow(() -> ApiException.notFound("Page"));
    }

    @Transactional
    public Page savePage(UUID id, PageCommand cmd) {
        Page p = id == null ? new Page() : pages.findById(id).orElseThrow(() -> ApiException.notFound("Page"));
        p.setSlug(slugify(cmd.slug() == null ? cmd.title() : cmd.slug()));
        p.setTitle(cmd.title());
        p.setType(cmd.type() == null ? "LANDING" : cmd.type());
        p.setSections(cmd.sections() == null ? new ArrayList<>() : new ArrayList<>(cmd.sections()));
        p.setStatus(cmd.publish() ? "PUBLISHED" : "DRAFT");
        if (cmd.seo() != null) p.setSeo(cmd.seo());
        return pages.save(p);
    }

    @Transactional(readOnly = true)
    public List<Page> allPages() {
        return pages.findAll();
    }

    // ------------------------------------------------------------------ blog

    @Transactional(readOnly = true)
    public List<BlogCategory> blogCategories() {
        return categories.findAll(org.springframework.data.domain.Sort.by("name"));
    }

    @Transactional
    public BlogCategory saveCategory(UUID id, String name, String description) {
        BlogCategory c = id == null ? new BlogCategory() : categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        c.setName(name);
        c.setSlug(slugify(name));
        c.setDescription(description);
        return categories.save(c);
    }

    /** Blog listing with category / tag filters and full-text search. */
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listPosts(String categorySlug, String tag, String q, int page, int size) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE b.status = 'PUBLISHED'");
        if (categorySlug != null && !categorySlug.isBlank()) {
            where.append(" AND c.slug = :category");
            p.addValue("category", categorySlug);
        }
        if (tag != null && !tag.isBlank()) {
            where.append(" AND EXISTS (SELECT 1 FROM blog_post_tags t WHERE t.post_id = b.id AND t.tag = :tag)");
            p.addValue("tag", tag.toLowerCase(Locale.ROOT));
        }
        boolean search = q != null && !q.isBlank();
        if (search) {
            where.append(" AND b.search_vector @@ websearch_to_tsquery('english', :q)");
            p.addValue("q", q);
        }
        int limit = Math.min(Math.max(size, 1), 50);
        p.addValue("limit", limit).addValue("offset", Math.max(page, 0) * limit);
        String from = " FROM blog_posts b LEFT JOIN blog_categories c ON c.id = b.category_id";
        Long total = jdbc.queryForObject("SELECT count(*)" + from + where, p, Long.class);
        String order = search ? " ORDER BY ts_rank(b.search_vector, websearch_to_tsquery('english', :q)) DESC" : " ORDER BY b.published_at DESC";
        List<Map<String, Object>> items = jdbc.query("SELECT b.*, c.name AS category_name, c.slug AS category_slug,"
                + " (SELECT string_agg(tag, ',') FROM blog_post_tags t WHERE t.post_id = b.id) AS tags"
                + from + where + order + " LIMIT :limit OFFSET :offset", p, (rs, i) -> card(rs));
        return PageResponse.of(items, page, limit, total == null ? 0 : total);
    }

    @Transactional
    public BlogPost readPost(String slug) {
        BlogPost post = posts.findBySlug(slug).filter(b -> "PUBLISHED".equals(b.getStatus()))
                .orElseThrow(() -> ApiException.notFound("Blog post"));
        jdbc.getJdbcTemplate().update("UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?", post.getId());
        return post;
    }

    /**
     * Scroll-based recommendations: the next posts to show under an article, ranked by shared
     * tags, same category and popularity, skipping posts the reader has already seen.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> recommendations(String slug, List<UUID> exclude, int limit) {
        BlogPost post = posts.findBySlug(slug).orElseThrow(() -> ApiException.notFound("Blog post"));
        List<UUID> skip = new ArrayList<>(exclude == null ? List.of() : exclude);
        skip.add(post.getId());
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("id", post.getId())
                .addValue("category", post.getCategoryId())
                .addValue("skip", skip)
                .addValue("limit", Math.min(Math.max(limit, 1), 10));
        return jdbc.query("""
                SELECT b.*, c.name AS category_name, c.slug AS category_slug,
                       (SELECT string_agg(tag, ',') FROM blog_post_tags t WHERE t.post_id = b.id) AS tags,
                       (SELECT count(*) FROM blog_post_tags t1 JOIN blog_post_tags t2 ON t1.tag = t2.tag
                         WHERE t1.post_id = b.id AND t2.post_id = :id) * 3
                       + CASE WHEN b.category_id = CAST(:category AS uuid) THEN 2 ELSE 0 END
                       + ln(1 + b.view_count) * 0.2 AS relevance
                FROM blog_posts b LEFT JOIN blog_categories c ON c.id = b.category_id
                WHERE b.status = 'PUBLISHED' AND b.id NOT IN (:skip)
                ORDER BY relevance DESC, b.published_at DESC
                LIMIT :limit""", p, (rs, i) -> card(rs));
    }

    @Transactional
    public BlogPost savePost(UUID id, PostCommand cmd) {
        BlogPost b = id == null ? new BlogPost() : posts.findById(id).orElseThrow(() -> ApiException.notFound("Blog post"));
        String slug = slugify(cmd.slug() == null || cmd.slug().isBlank() ? cmd.title() : cmd.slug());
        if ((id == null || !slug.equals(b.getSlug())) && posts.existsBySlug(slug)) throw ApiException.conflict("Slug already in use");
        b.setTitle(cmd.title());
        b.setSlug(slug);
        b.setExcerpt(cmd.excerpt());
        b.setContent(cmd.content());
        b.setCoverImageUrl(cmd.coverImageUrl());
        b.setCategoryId(cmd.categoryId());
        if (cmd.authorName() != null) b.setAuthorName(cmd.authorName());
        b.setStatus(cmd.publish() ? "PUBLISHED" : "DRAFT");
        if (cmd.publish() && b.getPublishedAt() == null) b.setPublishedAt(Instant.now());
        if (cmd.seo() != null) b.setSeo(cmd.seo());
        b.getTags().clear();
        if (cmd.tags() != null) b.getTags().addAll(new LinkedHashSet<>(cmd.tags().stream().map(t -> t.trim().toLowerCase(Locale.ROOT)).toList()));
        return posts.save(b);
    }

    @Transactional
    public void deletePost(UUID id) {
        posts.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<BlogPost> allPosts() {
        return posts.findAll(org.springframework.data.domain.Sort.by("createdAt").descending());
    }

    // ------------------------------------------------------------------ FAQ

    @Transactional(readOnly = true)
    public List<Faq> faqs(String category) {
        return category == null ? faqs.findByActiveTrueOrderByPositionAsc() : faqs.findByActiveTrueAndCategoryOrderByPositionAsc(category);
    }

    @Transactional
    public Faq saveFaq(UUID id, String question, String answer, String category, int position, boolean active) {
        Faq f = id == null ? new Faq() : faqs.findById(id).orElseThrow(() -> ApiException.notFound("FAQ"));
        f.setQuestion(question);
        f.setAnswer(answer);
        f.setCategory(category == null ? "GENERAL" : category);
        f.setPosition(position);
        f.setActive(active);
        return faqs.save(f);
    }

    @Transactional
    public void deleteFaq(UUID id) {
        faqs.deleteById(id);
    }

    // ------------------------------------------------------------------ contact & leads

    @Transactional
    public ContactInquiry contact(String name, String email, String phone, String subject, String message) {
        ContactInquiry c = new ContactInquiry();
        c.setName(name);
        c.setEmail(email.toLowerCase(Locale.ROOT));
        c.setPhone(phone);
        c.setSubject(subject);
        c.setMessage(message);
        inquiries.save(c);
        events.publish("contact.received", Map.of("inquiryId", c.getId(), "name", name, "email", c.getEmail(),
                "subject", subject, "message", message));
        return c;
    }

    @Transactional(readOnly = true)
    public PageResponse<ContactInquiry> inquiries(String status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? inquiries.findAll(pageable) : inquiries.findByStatus(status, pageable), x -> x);
    }

    @Transactional
    public ContactInquiry updateInquiry(UUID id, String status, String notes) {
        ContactInquiry c = inquiries.findById(id).orElseThrow(() -> ApiException.notFound("Inquiry"));
        if (status != null) c.setStatus(status);
        if (notes != null) c.setNotes(notes);
        return c;
    }

    @Transactional
    public Lead lead(Lead lead) {
        lead.setEmail(lead.getEmail().toLowerCase(Locale.ROOT));
        leads.save(lead);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("leadId", lead.getId());
        data.put("type", lead.getType());
        data.put("source", lead.getSource() == null ? "" : lead.getSource());
        data.put("utmCampaign", lead.getUtmCampaign() == null ? "" : lead.getUtmCampaign());
        events.publish("lead.captured", data);
        return lead;
    }

    @Transactional(readOnly = true)
    public PageResponse<Lead> leads(int page, int size) {
        return PageResponse.of(leads.findAll(Pagination.newestFirst(page, size)), x -> x);
    }

    @Transactional(readOnly = true)
    public String leadsCsv() {
        StringBuilder csv = new StringBuilder("created_at,name,email,phone,type,source,utm_source,utm_medium,utm_campaign\n");
        for (Lead l : leads.findAll(PageRequest.of(0, 10_000, org.springframework.data.domain.Sort.by("createdAt").descending()))) {
            csv.append(String.join(",", l.getCreatedAt().toString(), esc(l.getName()), esc(l.getEmail()), esc(l.getPhone()),
                    l.getType(), esc(l.getSource()), esc(l.getUtmSource()), esc(l.getUtmMedium()), esc(l.getUtmCampaign()))).append('\n');
        }
        return csv.toString();
    }

    // ------------------------------------------------------------------ SEO: sitemap

    @Transactional(readOnly = true)
    public String sitemap() {
        DateTimeFormatter iso = DateTimeFormatter.ISO_INSTANT;
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                + "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (Page p : pages.findByStatus("PUBLISHED")) {
            String path = "home".equals(p.getSlug()) ? "" : "/" + p.getSlug();
            xml.append(url(siteUrl + path, iso.format(p.getUpdatedAt()), "home".equals(p.getSlug()) ? "1.0" : "0.8"));
        }
        for (BlogPost b : posts.findByStatusOrderByPublishedAtDesc("PUBLISHED", PageRequest.of(0, 5000))) {
            xml.append(url(siteUrl + "/blog/" + b.getSlug(), iso.format(b.getUpdatedAt()), "0.6"));
        }
        return xml.append("</urlset>\n").toString();
    }

    // ------------------------------------------------------------------ helpers

    private static String url(String loc, String lastmod, String priority) {
        return "  <url><loc>" + loc + "</loc><lastmod>" + lastmod + "</lastmod><priority>" + priority + "</priority></url>\n";
    }

    private static Map<String, Object> card(java.sql.ResultSet rs) throws java.sql.SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", rs.getObject("id", UUID.class));
        m.put("title", rs.getString("title"));
        m.put("slug", rs.getString("slug"));
        m.put("excerpt", rs.getString("excerpt"));
        m.put("coverImageUrl", rs.getString("cover_image_url"));
        m.put("category", rs.getString("category_name"));
        m.put("categorySlug", rs.getString("category_slug"));
        m.put("authorName", rs.getString("author_name"));
        m.put("readingMinutes", rs.getInt("reading_minutes"));
        m.put("viewCount", rs.getInt("view_count"));
        java.sql.Timestamp published = rs.getTimestamp("published_at");
        m.put("publishedAt", published == null ? null : published.toInstant());
        String tags = rs.getString("tags");
        m.put("tags", tags == null ? List.of() : Arrays.asList(tags.split(",")));
        return m;
    }

    public static String slugify(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private static String esc(String v) {
        if (v == null) return "";
        return v.contains(",") || v.contains("\"") ? "\"" + v.replace("\"", "\"\"") + "\"" : v;
    }
}
