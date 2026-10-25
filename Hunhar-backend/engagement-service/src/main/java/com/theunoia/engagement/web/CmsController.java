package com.theunoia.engagement.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.engagement.domain.ContactInquiry;
import com.theunoia.engagement.domain.LandingPageContent;
import com.theunoia.engagement.service.CmsService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/content")
@RequiredArgsConstructor
public class CmsController {

    private final CmsService cmsService;

    @GetMapping("/pages/{slug}")
    public ResponseEntity<ApiResponse<LandingPageContent>> getPage(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(cmsService.getLandingPage(slug)));
    }

    @PostMapping("/pages/{slug}")
    public ResponseEntity<ApiResponse<LandingPageContent>> savePage(
            @PathVariable String slug,
            @RequestBody SavePageRequest req
    ) {
        LandingPageContent page = cmsService.saveLandingPage(slug, req.getTitle(), req.getContentJson(), req.getMetaDescription(), req.getMetaKeywords());
        return ResponseEntity.ok(ApiResponse.ok("Page updated", page));
    }

    @PostMapping("/contact")
    public ResponseEntity<ApiResponse<ContactInquiry>> submitContact(@RequestBody ContactRequest req) {
        ContactInquiry inquiry = cmsService.submitInquiry(req.getName(), req.getEmail(), req.getPhone(), req.getSubject(), req.getMessage());
        return ResponseEntity.ok(ApiResponse.ok("Thank you for your inquiry. Our team will contact you shortly.", inquiry));
    }

    @GetMapping("/inquiries")
    public ResponseEntity<ApiResponse<List<ContactInquiry>>> getInquiries() {
        return ResponseEntity.ok(ApiResponse.ok(cmsService.getAllInquiries()));
    }

    @GetMapping("/faq")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getFaq() {
        List<Map<String, String>> faqs = List.of(
                Map.of("q", "How does bidding with credits work?", "a", "Freelancers receive 10 starter credits upon registration. Each project bid consumes 2 credits. Additional credits can be purchased at any time."),
                Map.of("q", "How are payments protected?", "a", "THEUNOiA holds milestone funds in escrow before work begins and releases payout directly to the freelancer upon milestone approval."),
                Map.of("q", "What verification is required?", "a", "We verify email addresses and Aadhaar identity via DigiLocker Lite to ensure trustworthy platform participants.")
        );
        return ResponseEntity.ok(ApiResponse.ok(faqs));
    }

    @GetMapping("/blog-categories")
    public ResponseEntity<ApiResponse<List<String>>> getBlogCategories() {
        return ResponseEntity.ok(ApiResponse.ok(List.of(
                "Software & Technology",
                "Design & Creative",
                "Digital Marketing",
                "Freelancing Tips & Growth",
                "Business & Entrepreneurship"
        )));
    }

    @Data
    public static class SavePageRequest {
        private String title;
        private String contentJson;
        private String metaDescription;
        private String metaKeywords;
    }

    @Data
    public static class ContactRequest {
        private String name;
        private String email;
        private String phone;
        private String subject;
        private String message;
    }
}
