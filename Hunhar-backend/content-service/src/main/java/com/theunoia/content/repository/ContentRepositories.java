package com.theunoia.content.repository;

import com.theunoia.content.domain.ContentEntities.BlogCategory;
import com.theunoia.content.domain.ContentEntities.BlogPost;
import com.theunoia.content.domain.ContentEntities.ContactInquiry;
import com.theunoia.content.domain.ContentEntities.Faq;
import com.theunoia.content.domain.ContentEntities.Lead;
import com.theunoia.content.domain.ContentEntities.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class ContentRepositories {

    private ContentRepositories() {
    }

    public interface PageRepository extends JpaRepository<Page, UUID> {
        Optional<Page> findBySlug(String slug);

        List<Page> findByStatus(String status);
    }

    public interface BlogCategoryRepository extends JpaRepository<BlogCategory, UUID> {
        Optional<BlogCategory> findBySlug(String slug);
    }

    public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {
        Optional<BlogPost> findBySlug(String slug);

        boolean existsBySlug(String slug);

        List<BlogPost> findByStatusOrderByPublishedAtDesc(String status, Pageable pageable);
    }

    public interface FaqRepository extends JpaRepository<Faq, UUID> {
        List<Faq> findByActiveTrueOrderByPositionAsc();

        List<Faq> findByActiveTrueAndCategoryOrderByPositionAsc(String category);
    }

    public interface InquiryRepository extends JpaRepository<ContactInquiry, UUID> {
        org.springframework.data.domain.Page<ContactInquiry> findByStatus(String status, Pageable pageable);
    }

    public interface LeadRepository extends JpaRepository<Lead, UUID> {
    }
}
