package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.LandingPageContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LandingPageContentRepository extends JpaRepository<LandingPageContent, UUID> {
    Optional<LandingPageContent> findBySlug(String slug);
}
