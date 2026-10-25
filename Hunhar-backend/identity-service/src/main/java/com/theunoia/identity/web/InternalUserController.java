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

    @PostMapping("/freelancers/{id}/completed-project")
    public Map<String, Object> recordCompletedProject(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Object revenue = body.get("revenue");
        profileService.recordCompletedProject(id, revenue == null ? null : new BigDecimal(revenue.toString()));
        return Map.of("ok", true);
    }
}
