package com.theunoia.user.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.web.PageResponse;
import com.theunoia.user.domain.Certification;
import com.theunoia.user.domain.ClientProfile;
import com.theunoia.user.domain.Experience;
import com.theunoia.user.domain.FreelancerProfile;
import com.theunoia.user.domain.PortfolioItem;
import com.theunoia.user.dto.UserDtos.CertificationRequest;
import com.theunoia.user.dto.UserDtos.ClientProfileResponse;
import com.theunoia.user.dto.UserDtos.ClientProfileUpdate;
import com.theunoia.user.dto.UserDtos.ExperienceRequest;
import com.theunoia.user.dto.UserDtos.FreelancerCard;
import com.theunoia.user.dto.UserDtos.FreelancerProfileResponse;
import com.theunoia.user.dto.UserDtos.FreelancerProfileUpdate;
import com.theunoia.user.dto.UserDtos.PortfolioRequest;
import com.theunoia.user.dto.UserDtos.StatsResponse;
import com.theunoia.user.repository.ProfileRepositories.CertificationRepository;
import com.theunoia.user.repository.ProfileRepositories.ClientProfileRepository;
import com.theunoia.user.repository.ProfileRepositories.ExperienceRepository;
import com.theunoia.user.repository.ProfileRepositories.FreelancerProfileRepository;
import com.theunoia.user.repository.ProfileRepositories.PortfolioItemRepository;
import com.theunoia.user.repository.StatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final int MAX_PORTFOLIO_ITEMS = 50;

    private final FreelancerProfileRepository freelancers;
    private final ClientProfileRepository clients;
    private final PortfolioItemRepository portfolio;
    private final ExperienceRepository experiences;
    private final CertificationRepository certifications;
    private final StatsRepository stats;
    private final EventPublisher events;

    // ------------------------------------------------------------------ freelancer

    @Transactional(readOnly = true)
    public FreelancerProfileResponse freelancer(UUID userId) {
        FreelancerProfile p = freelancers.findById(userId).orElseThrow(() -> ApiException.notFound("Freelancer profile"));
        return FreelancerProfileResponse.of(p, portfolio.findByUserIdOrderByCreatedAtDesc(userId),
                experiences.findByUserIdOrderByStartDateDesc(userId), certifications.findByUserIdOrderByIssuedOnDesc(userId),
                stats.find(userId).orElse(null));
    }

    @Transactional
    public FreelancerProfileResponse updateFreelancer(UUID userId, FreelancerProfileUpdate req) {
        FreelancerProfile p = freelancers.findById(userId).orElseThrow(() -> ApiException.notFound("Freelancer profile"));
        p.setFullName(req.fullName());
        p.setHeadline(req.headline());
        p.setBio(req.bio());
        p.setHourlyRate(req.hourlyRate());
        p.setLocation(req.location());
        p.setAvatarUrl(req.avatarUrl());
        p.setExperienceYears(req.experienceYears());
        if (req.availability() != null) p.setAvailability(req.availability());
        publishUpdated(userId, "FREELANCER", req.fullName());
        return freelancer(userId);
    }

    @Transactional
    public List<String> updateSkills(UUID userId, List<String> skills) {
        FreelancerProfile p = freelancers.findById(userId).orElseThrow(() -> ApiException.notFound("Freelancer profile"));
        p.getSkills().clear();
        p.getSkills().addAll(normalizeSkills(skills));
        return List.copyOf(p.getSkills());
    }

    @Transactional
    public PortfolioItem addPortfolio(UUID userId, PortfolioRequest req) {
        requireFreelancer(userId);
        if (portfolio.countByUserId(userId) >= MAX_PORTFOLIO_ITEMS) throw ApiException.badRequest("Portfolio limit reached");
        PortfolioItem item = new PortfolioItem();
        item.setUserId(userId);
        applyPortfolio(item, req);
        return portfolio.save(item);
    }

    @Transactional
    public PortfolioItem updatePortfolio(UUID userId, UUID id, PortfolioRequest req) {
        PortfolioItem item = portfolio.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Portfolio item"));
        applyPortfolio(item, req);
        return item;
    }

    @Transactional
    public void deletePortfolio(UUID userId, UUID id) {
        portfolio.delete(portfolio.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Portfolio item")));
    }

    @Transactional
    public Experience addExperience(UUID userId, ExperienceRequest req) {
        requireFreelancer(userId);
        Experience e = new Experience();
        e.setUserId(userId);
        applyExperience(e, req);
        return experiences.save(e);
    }

    @Transactional
    public Experience updateExperience(UUID userId, UUID id, ExperienceRequest req) {
        Experience e = experiences.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Experience"));
        applyExperience(e, req);
        return e;
    }

    @Transactional
    public void deleteExperience(UUID userId, UUID id) {
        experiences.delete(experiences.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Experience")));
    }

    @Transactional
    public Certification addCertification(UUID userId, CertificationRequest req) {
        requireFreelancer(userId);
        Certification c = new Certification();
        c.setUserId(userId);
        applyCertification(c, req);
        return certifications.save(c);
    }

    @Transactional
    public Certification updateCertification(UUID userId, UUID id, CertificationRequest req) {
        Certification c = certifications.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Certification"));
        applyCertification(c, req);
        return c;
    }

    @Transactional
    public void deleteCertification(UUID userId, UUID id) {
        certifications.delete(certifications.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("Certification")));
    }

    @Transactional(readOnly = true)
    public PageResponse<FreelancerCard> search(String skill, String q, BigDecimal maxRate, int page, int size) {
        int limit = Math.min(Math.max(size, 1), 100);
        int offset = Math.max(page, 0) * limit;
        return PageResponse.of(stats.search(skill, q, maxRate, limit, offset), page, limit, stats.count(skill, q, maxRate));
    }

    @Transactional(readOnly = true)
    public List<FreelancerCard> leaderboard(int limit) {
        return stats.leaderboard(Math.min(Math.max(limit, 1), 100));
    }

    @Transactional(readOnly = true)
    public StatsResponse stats(UUID userId) {
        return stats.find(userId).orElseThrow(() -> ApiException.notFound("Freelancer stats"));
    }

    // ------------------------------------------------------------------ client

    @Transactional(readOnly = true)
    public ClientProfileResponse client(UUID userId) {
        return ClientProfileResponse.of(clients.findById(userId).orElseThrow(() -> ApiException.notFound("Client profile")));
    }

    @Transactional
    public ClientProfileResponse updateClient(UUID userId, ClientProfileUpdate req) {
        ClientProfile c = clients.findById(userId).orElseThrow(() -> ApiException.notFound("Client profile"));
        c.setCompanyName(req.companyName());
        c.setContactPerson(req.contactPerson());
        c.setWebsite(req.website());
        c.setIndustry(req.industry());
        c.setCompanySize(req.companySize());
        c.setAbout(req.about());
        c.setLogoUrl(req.logoUrl());
        c.setGstin(req.gstin());
        c.setLocation(req.location());
        publishUpdated(userId, "CLIENT", req.companyName());
        return ClientProfileResponse.of(c);
    }

    // ------------------------------------------------------------------ provisioning (from events)

    @Transactional
    public void provisionFreelancer(UUID userId, String fullName, List<String> skills, List<String> portfolioLinks) {
        if (freelancers.existsById(userId)) return;
        FreelancerProfile p = new FreelancerProfile();
        p.setUserId(userId);
        p.setFullName(fullName);
        p.setSkills(normalizeSkills(skills));
        freelancers.saveAndFlush(p);
        stats.ensure(userId);
        int i = 1;
        for (String link : portfolioLinks) {
            PortfolioItem item = new PortfolioItem();
            item.setUserId(userId);
            item.setTitle("Portfolio link " + i++);
            item.setUrl(link);
            portfolio.save(item);
        }
    }

    @Transactional
    public void provisionClient(UUID userId, String companyName, String contactPerson) {
        if (clients.existsById(userId)) return;
        ClientProfile c = new ClientProfile();
        c.setUserId(userId);
        c.setCompanyName(companyName);
        c.setContactPerson(contactPerson);
        clients.save(c);
    }

    @Transactional
    public void updateVerificationStatus(UUID userId, String status) {
        if (freelancers.updateStatus(userId, status) == 0) clients.updateStatus(userId, status);
    }

    // ------------------------------------------------------------------ helpers

    private void requireFreelancer(UUID userId) {
        if (!freelancers.existsById(userId)) throw ApiException.notFound("Freelancer profile");
    }

    private void publishUpdated(UUID userId, String role, String name) {
        events.publish("user.profile_updated", Map.of("userId", userId, "role", role, "displayName", name));
    }

    private static LinkedHashSet<String> normalizeSkills(List<String> skills) {
        return skills.stream().map(String::trim).filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static void applyPortfolio(PortfolioItem item, PortfolioRequest req) {
        item.setTitle(req.title());
        item.setUrl(req.url());
        item.setDescription(req.description());
        item.setImageUrl(req.imageUrl());
    }

    private static void applyExperience(Experience e, ExperienceRequest req) {
        if (req.endDate() != null && req.endDate().isBefore(req.startDate())) {
            throw ApiException.badRequest("End date cannot be before start date");
        }
        e.setCompany(req.company());
        e.setTitle(req.title());
        e.setStartDate(req.startDate());
        e.setEndDate(req.currentlyWorking() ? null : req.endDate());
        e.setCurrentlyWorking(req.currentlyWorking());
        e.setDescription(req.description());
    }

    private static void applyCertification(Certification c, CertificationRequest req) {
        c.setName(req.name());
        c.setIssuer(req.issuer());
        c.setIssuedOn(req.issuedOn());
        c.setExpiresOn(req.expiresOn());
        c.setCredentialUrl(req.credentialUrl());
    }
}
