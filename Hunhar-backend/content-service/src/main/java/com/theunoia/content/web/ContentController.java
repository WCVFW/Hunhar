package com.theunoia.content.web;

import com.theunoia.common.web.PageResponse;
import com.theunoia.content.domain.ContentEntities.BlogCategory;
import com.theunoia.content.domain.ContentEntities.BlogPost;
import com.theunoia.content.domain.ContentEntities.ContactInquiry;
import com.theunoia.content.domain.ContentEntities.Faq;
import com.theunoia.content.domain.ContentEntities.Lead;
import com.theunoia.content.domain.ContentEntities.Page;
import com.theunoia.content.domain.ContentEntities.Seo;
import com.theunoia.content.service.ContentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ContentController {

    private final ContentService content;

    public record ContactRequest(@NotBlank @Size(max = 150) String name, @NotBlank @Email String email,
                                 @Pattern(regexp = "^[6-9]\\d{9}$") String phone, @NotBlank @Size(max = 200) String subject,
                                 @NotBlank @Size(max = 5000) String message) {
    }

    public record LeadRequest(@Size(max = 150) String name, @NotBlank @Email String email, @Pattern(regexp = "^[6-9]\\d{9}$") String phone,
                              @NotBlank @Pattern(regexp = "FREELANCER|CLIENT|OTHER") String type, @Size(max = 150) String source,
                              @Size(max = 100) String utmSource, @Size(max = 100) String utmMedium, @Size(max = 100) String utmCampaign,
                              Map<String, Object> metadata) {
    }

    public record PostRequest(@NotBlank @Size(max = 200) String title, @Size(max = 220) String slug, @Size(max = 500) String excerpt,
                              @NotBlank String content, String coverImageUrl, UUID categoryId, String authorName, boolean publish,
                              @Size(max = 10) List<String> tags, Seo seo) {
    }

    public record PageRequest(@Size(max = 150) String slug, @NotBlank @Size(max = 200) String title,
                              @Pattern(regexp = "STATIC|LANDING") String type, List<Map<String, Object>> sections, boolean publish, Seo seo) {
    }

    public record FaqRequest(@NotBlank @Size(max = 300) String question, @NotBlank String answer,
                             @Pattern(regexp = "GENERAL|FREELANCER|CLIENT|PAYMENTS|CREDITS") String category, int position, boolean active) {
    }

    public record CategoryRequest(@NotBlank @Size(max = 100) String name, @Size(max = 500) String description) {
    }

    public record InquiryUpdate(@Pattern(regexp = "NEW|IN_PROGRESS|RESOLVED") String status, String notes) {
    }

    // ------------------------------------------------------------------ public website

    @GetMapping("/api/v1/content/pages/{slug}")
    public Page page(@PathVariable String slug) {
        return content.page(slug);
    }

    @GetMapping("/api/v1/content/blog/categories")
    public List<BlogCategory> categories() {
        return content.blogCategories();
    }

    @GetMapping("/api/v1/content/blog/posts")
    public PageResponse<Map<String, Object>> posts(@RequestParam(required = false) String category,
                                                   @RequestParam(required = false) String tag,
                                                   @RequestParam(required = false) String q,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "12") int size) {
        return content.listPosts(category, tag, q, page, size);
    }

    @GetMapping("/api/v1/content/blog/posts/{slug}")
    public BlogPost post(@PathVariable String slug) {
        return content.readPost(slug);
    }

    @GetMapping("/api/v1/content/blog/posts/{slug}/recommendations")
    public List<Map<String, Object>> recommendations(@PathVariable String slug,
                                                     @RequestParam(required = false) List<UUID> exclude,
                                                     @RequestParam(defaultValue = "3") int limit) {
        return content.recommendations(slug, exclude, limit);
    }

    @GetMapping("/api/v1/content/faqs")
    public List<Faq> faqs(@RequestParam(required = false) String category) {
        return content.faqs(category);
    }

    @PostMapping("/api/v1/content/contact")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> contact(@Valid @RequestBody ContactRequest req) {
        ContactInquiry c = content.contact(req.name(), req.email(), req.phone(), req.subject(), req.message());
        return Map.of("id", c.getId(), "message", "Thanks! Our team will get back to you shortly.");
    }

    @PostMapping("/api/v1/content/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> lead(@Valid @RequestBody LeadRequest req) {
        Lead l = new Lead();
        l.setName(req.name());
        l.setEmail(req.email());
        l.setPhone(req.phone());
        l.setType(req.type());
        l.setSource(req.source());
        l.setUtmSource(req.utmSource());
        l.setUtmMedium(req.utmMedium());
        l.setUtmCampaign(req.utmCampaign());
        if (req.metadata() != null) l.setMetadata(req.metadata());
        return Map.of("id", content.lead(l).getId());
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600").body(content.sitemap());
    }

    // ------------------------------------------------------------------ admin CMS

    @GetMapping("/api/v1/admin/content/pages")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Page> allPages() {
        return content.allPages();
    }

    @PostMapping("/api/v1/admin/content/pages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Page createPage(@Valid @RequestBody PageRequest req) {
        return content.savePage(null, new ContentService.PageCommand(req.slug(), req.title(), req.type(), req.sections(), req.publish(), req.seo()));
    }

    @PutMapping("/api/v1/admin/content/pages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Page updatePage(@PathVariable UUID id, @Valid @RequestBody PageRequest req) {
        return content.savePage(id, new ContentService.PageCommand(req.slug(), req.title(), req.type(), req.sections(), req.publish(), req.seo()));
    }

    @GetMapping("/api/v1/admin/content/posts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BlogPost> allPosts() {
        return content.allPosts();
    }

    @PostMapping("/api/v1/admin/content/posts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public BlogPost createPost(@Valid @RequestBody PostRequest req) {
        return content.savePost(null, command(req));
    }

    @PutMapping("/api/v1/admin/content/posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BlogPost updatePost(@PathVariable UUID id, @Valid @RequestBody PostRequest req) {
        return content.savePost(id, command(req));
    }

    @DeleteMapping("/api/v1/admin/content/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePost(@PathVariable UUID id) {
        content.deletePost(id);
    }

    @PostMapping("/api/v1/admin/content/blog-categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public BlogCategory createCategory(@Valid @RequestBody CategoryRequest req) {
        return content.saveCategory(null, req.name(), req.description());
    }

    @PostMapping("/api/v1/admin/content/faqs")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Faq createFaq(@Valid @RequestBody FaqRequest req) {
        return content.saveFaq(null, req.question(), req.answer(), req.category(), req.position(), req.active());
    }

    @PutMapping("/api/v1/admin/content/faqs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Faq updateFaq(@PathVariable UUID id, @Valid @RequestBody FaqRequest req) {
        return content.saveFaq(id, req.question(), req.answer(), req.category(), req.position(), req.active());
    }

    @DeleteMapping("/api/v1/admin/content/faqs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteFaq(@PathVariable UUID id) {
        content.deleteFaq(id);
    }

    @GetMapping("/api/v1/admin/content/inquiries")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ContactInquiry> inquiries(@RequestParam(required = false) String status,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "50") int size) {
        return content.inquiries(status, page, size);
    }

    @PatchMapping("/api/v1/admin/content/inquiries/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ContactInquiry updateInquiry(@PathVariable UUID id, @Valid @RequestBody InquiryUpdate req) {
        return content.updateInquiry(id, req.status(), req.notes());
    }

    @GetMapping("/api/v1/admin/content/leads")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<Lead> leads(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        return content.leads(page, size);
    }

    @GetMapping(value = "/api/v1/admin/content/leads/export", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportLeads() {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=leads.csv").body(content.leadsCsv());
    }

    private static ContentService.PostCommand command(PostRequest r) {
        return new ContentService.PostCommand(r.title(), r.slug(), r.excerpt(), r.content(), r.coverImageUrl(), r.categoryId(),
                r.authorName(), r.publish(), r.tags(), r.seo());
    }
}
