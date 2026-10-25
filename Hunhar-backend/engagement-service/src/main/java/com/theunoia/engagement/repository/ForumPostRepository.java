package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.ForumPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, UUID> {
    Page<ForumPost> findByTopic(String topic, Pageable pageable);
}
