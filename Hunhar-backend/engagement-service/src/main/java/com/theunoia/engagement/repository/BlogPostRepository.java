package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlogPostRepository extends JpaRepository<BlogPost, UUID> {

    List<BlogPost> findByStatusOrderByPublishedAtDesc(BlogPost.Status status);

    List<BlogPost> findAllByOrderByUpdatedAtDesc();

    Optional<BlogPost> findBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    boolean existsBySlug(String slug);
}
