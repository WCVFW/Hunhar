package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.ForumComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, UUID> {
    List<ForumComment> findByPostIdOrderByCreatedAtAsc(UUID postId);
}
