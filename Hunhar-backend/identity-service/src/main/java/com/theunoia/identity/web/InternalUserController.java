package com.theunoia.identity.web;

import com.theunoia.common.internal.UserDirectoryClient;
import com.theunoia.identity.service.FreelancerProfileService;
import com.theunoia.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** Service-to-service endpoints (protected by the internal key, not routed by the gateway). */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;
    private final FreelancerProfileService profileService;
    private final com.theunoia.identity.repository.UserRepository userRepository;
    private final com.theunoia.identity.service.EmailService emailService;

    @GetMapping("/users/lookup")
    public List<UserDirectoryClient.UserInfo> lookup(@RequestParam String ids) {
        List<UUID> parsed = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .limit(200)
                .map(UUID::fromString)
                .collect(Collectors.toList());
        return userService.lookup(parsed);
    }

    @GetMapping("/users/{id}/kyc")
    public Map<String, Object> kycStatus(@PathVariable UUID id) {
        return Map.of("kycStatus", userRepository.findById(id).map(u -> u.getKycStatus().name()).orElse("NOT_SUBMITTED"));
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return userService.stats();
    }

    @PostMapping("/freelancers/{id}/completed-project")
    public Map<String, Object> recordCompletedProject(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Object revenue = body.get("revenue");
        profileService.recordCompletedProject(id, revenue == null ? null : new BigDecimal(revenue.toString()));
        return Map.of("ok", true);
    }

    @PostMapping("/email/send")
    public Map<String, Object> sendEmail(@RequestBody EmailRequest req) {
        byte[] attachment = req.attachmentBase64() == null || req.attachmentBase64().isBlank()
                ? null : java.util.Base64.getDecoder().decode(req.attachmentBase64());
        emailService.sendEmailMessage(req.to(), req.subject(), req.text(), req.html(),
                req.attachmentName(), attachment, req.attachmentContentType());
        return Map.of("success", true);
    }

    /** Transactional email from other services; the attachment (e.g. an invoice PDF) is optional. */
    public record EmailRequest(String to, String subject, String text, String html,
                               String attachmentName, String attachmentBase64, String attachmentContentType) {}
}
