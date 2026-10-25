package com.theunoia.engagement.service;

import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.engagement.domain.ContactInquiry;
import com.theunoia.engagement.domain.LandingPageContent;
import com.theunoia.engagement.repository.ContactInquiryRepository;
import com.theunoia.engagement.repository.LandingPageContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CmsService {

    private final LandingPageContentRepository landingPageRepository;
    private final ContactInquiryRepository contactInquiryRepository;

    public LandingPageContent getLandingPage(String slug) {
        return landingPageRepository.findBySlug(slug)
                .orElseGet(() -> LandingPageContent.builder()
                        .slug(slug)
                        .title("THEUNOiA - " + slug.substring(0, 1).toUpperCase() + slug.substring(1))
                        .contentJson("{\"tagline\": \"Connecting businesses with world-class freelancers\"}")
                        .metaDescription("THEUNOiA Freelancing Marketplace - " + slug)
                        .metaKeywords("freelance, projects, remote work, verified talent")
                        .build());
    }

    @Transactional
    public LandingPageContent saveLandingPage(String slug, String title, String contentJson, String metaDesc, String metaKeywords) {
        LandingPageContent page = landingPageRepository.findBySlug(slug)
                .orElseGet(() -> LandingPageContent.builder().slug(slug).build());

        page.setTitle(title);
        page.setContentJson(contentJson);
        page.setMetaDescription(metaDesc);
        page.setMetaKeywords(metaKeywords);

        return landingPageRepository.save(page);
    }

    @Transactional
    public ContactInquiry submitInquiry(String name, String email, String phone, String subject, String message) {
        ContactInquiry inquiry = ContactInquiry.builder()
                .name(name)
                .email(email)
                .phone(phone)
                .subject(subject)
                .message(message)
                .status("NEW")
                .build();
        return contactInquiryRepository.save(inquiry);
    }

    public List<ContactInquiry> getAllInquiries() {
        return contactInquiryRepository.findAll();
    }
}
