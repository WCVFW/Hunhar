package com.theunoia.user.web;

import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.user.domain.Certification;
import com.theunoia.user.domain.Experience;
import com.theunoia.user.domain.PortfolioItem;
import com.theunoia.user.dto.UserDtos.CertificationRequest;
import com.theunoia.user.dto.UserDtos.ClientProfileResponse;
import com.theunoia.user.dto.UserDtos.ClientProfileUpdate;
import com.theunoia.user.dto.UserDtos.ExperienceRequest;
import com.theunoia.user.dto.UserDtos.FreelancerCard;
import com.theunoia.user.dto.UserDtos.FreelancerProfileResponse;
import com.theunoia.user.dto.UserDtos.FreelancerProfileUpdate;
import com.theunoia.user.dto.UserDtos.PortfolioRequest;
import com.theunoia.user.dto.UserDtos.SkillsUpdate;
import com.theunoia.user.dto.UserDtos.StatsResponse;
import com.theunoia.user.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profiles;

    // ------------------------------------------------------------------ public

    @GetMapping("/freelancers")
    public PageResponse<FreelancerCard> searchFreelancers(@RequestParam(required = false) String skill,
                                                         @RequestParam(required = false) String q,
                                                         @RequestParam(required = false) BigDecimal maxHourlyRate,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        return profiles.search(skill, q, maxHourlyRate, page, size);
    }

    @GetMapping("/freelancers/{userId}")
    public FreelancerProfileResponse freelancer(@PathVariable UUID userId) {
        return profiles.freelancer(userId);
    }

    @GetMapping("/clients/{userId}")
    public ClientProfileResponse client(@PathVariable UUID userId) {
        return profiles.client(userId);
    }

    @GetMapping("/leaderboard")
    public List<FreelancerCard> leaderboard(@RequestParam(defaultValue = "20") int limit) {
        return profiles.leaderboard(limit);
    }

    // ------------------------------------------------------------------ own profile

    @GetMapping("/me")
    public Object me() {
        AuthUser user = CurrentUser.require();
        return user.isClient() ? profiles.client(user.id()) : profiles.freelancer(user.id());
    }

    @GetMapping("/me/stats")
    @PreAuthorize("hasRole('FREELANCER')")
    public StatsResponse myStats() {
        return profiles.stats(CurrentUser.require().id());
    }

    @PutMapping("/me/freelancer-profile")
    @PreAuthorize("hasRole('FREELANCER')")
    public FreelancerProfileResponse updateFreelancer(@Valid @RequestBody FreelancerProfileUpdate req) {
        return profiles.updateFreelancer(CurrentUser.require().id(), req);
    }

    @PutMapping("/me/skills")
    @PreAuthorize("hasRole('FREELANCER')")
    public List<String> updateSkills(@Valid @RequestBody SkillsUpdate req) {
        return profiles.updateSkills(CurrentUser.require().id(), req.skills());
    }

    @PostMapping("/me/portfolio")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER')")
    public PortfolioItem addPortfolio(@Valid @RequestBody PortfolioRequest req) {
        return profiles.addPortfolio(CurrentUser.require().id(), req);
    }

    @PutMapping("/me/portfolio/{id}")
    @PreAuthorize("hasRole('FREELANCER')")
    public PortfolioItem updatePortfolio(@PathVariable UUID id, @Valid @RequestBody PortfolioRequest req) {
        return profiles.updatePortfolio(CurrentUser.require().id(), id, req);
    }

    @DeleteMapping("/me/portfolio/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('FREELANCER')")
    public void deletePortfolio(@PathVariable UUID id) {
        profiles.deletePortfolio(CurrentUser.require().id(), id);
    }

    @PostMapping("/me/experiences")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER')")
    public Experience addExperience(@Valid @RequestBody ExperienceRequest req) {
        return profiles.addExperience(CurrentUser.require().id(), req);
    }

    @PutMapping("/me/experiences/{id}")
    @PreAuthorize("hasRole('FREELANCER')")
    public Experience updateExperience(@PathVariable UUID id, @Valid @RequestBody ExperienceRequest req) {
        return profiles.updateExperience(CurrentUser.require().id(), id, req);
    }

    @DeleteMapping("/me/experiences/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('FREELANCER')")
    public void deleteExperience(@PathVariable UUID id) {
        profiles.deleteExperience(CurrentUser.require().id(), id);
    }

    @PostMapping("/me/certifications")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER')")
    public Certification addCertification(@Valid @RequestBody CertificationRequest req) {
        return profiles.addCertification(CurrentUser.require().id(), req);
    }

    @PutMapping("/me/certifications/{id}")
    @PreAuthorize("hasRole('FREELANCER')")
    public Certification updateCertification(@PathVariable UUID id, @Valid @RequestBody CertificationRequest req) {
        return profiles.updateCertification(CurrentUser.require().id(), id, req);
    }

    @DeleteMapping("/me/certifications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('FREELANCER')")
    public void deleteCertification(@PathVariable UUID id) {
        profiles.deleteCertification(CurrentUser.require().id(), id);
    }

    @PutMapping("/me/client-profile")
    @PreAuthorize("hasRole('CLIENT')")
    public ClientProfileResponse updateClient(@Valid @RequestBody ClientProfileUpdate req) {
        return profiles.updateClient(CurrentUser.require().id(), req);
    }
}
