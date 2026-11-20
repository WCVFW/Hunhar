package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.engagement.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Blog: public articles + SEO files, and the separate blog dashboard (EDITOR accounts, or platform admins).
 */
@RestController
@RequestMapping("/api/v1/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;

    // ------------------------------------------------------------------ public

    @GetMapping("/public/posts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> posts() {
        return ResponseEntity.ok(ApiResponse.ok(blogService.publishedPosts()));
    }

    @GetMapping("/public/posts/{slug}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> post(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(blogService.publishedPost(slug)));
    }

    /** Served at https://www.hunhar.in/sitemap.xml (nginx). */
    @GetMapping(value = "/public/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .contentType(MediaType.APPLICATION_XML).body(blogService.sitemapXml());
    }

    /** Served at https://www.hunhar.in/llms.txt (nginx). */
    @GetMapping(value = "/public/llms.txt", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> llms() {
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofMinutes(10)).cachePublic())
                .contentType(MediaType.parseMediaType("text/plain;charset=UTF-8")).body(blogService.llmsTxt());
    }

    // ------------------------------------------------------------------ dashboard

    @PostMapping("/auth/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful", blogService.login(body.get("email"), body.get("password"))));
    }

    @GetMapping("/admin/posts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> allPosts(@CurrentUser AuthUser user) {
        requireWriter(user);
        return ResponseEntity.ok(ApiResponse.ok(blogService.allPosts()));
    }

    /** Create (no id) or update (with id) an article. */
    @PostMapping("/admin/posts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@CurrentUser AuthUser user, @RequestBody Map<String, Object> body) {
        String by = requireWriter(user);
        return ResponseEntity.ok(ApiResponse.ok("Article saved", blogService.save(body, by)));
    }

    @DeleteMapping("/admin/posts/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@CurrentUser AuthUser user, @PathVariable UUID id) {
        requireWriter(user);
        blogService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Article deleted", null));
    }

    /** Returns who is saving (for the audit field); only blog editors and admins may write. */
    private String requireWriter(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Please sign in to the blog dashboard");
        if (user.hasRole("ADMIN")) return user.email() != null ? user.email() : "admin";
        if (user.hasRole("EDITOR")) return blogService.activeEditor(user.id()).getEmail();
        throw new ForbiddenException("Only blog editors can manage articles");
    }
}
