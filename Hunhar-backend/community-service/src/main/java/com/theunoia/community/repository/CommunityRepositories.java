package com.theunoia.community.repository;

import com.theunoia.community.domain.CommunityEntities.ContentReport;
import com.theunoia.community.domain.CommunityEntities.ForumCategory;
import com.theunoia.community.domain.CommunityEntities.Reply;
import com.theunoia.community.domain.CommunityEntities.ForumThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public final class CommunityRepositories {

    private CommunityRepositories() {
    }

    public interface CategoryRepository extends JpaRepository<ForumCategory, UUID> {
        List<ForumCategory> findByActiveTrueOrderByPositionAsc();

        boolean existsBySlug(String slug);
    }

    public interface ThreadRepository extends JpaRepository<ForumThread, UUID> {
        Page<ForumThread> findByAuthorIdAndStatusNot(UUID authorId, String status, Pageable pageable);
    }

    public interface ReplyRepository extends JpaRepository<Reply, UUID> {
        List<Reply> findByThreadIdAndStatusOrderByCreatedAtAsc(UUID threadId, String status);

        List<Reply> findByThreadIdOrderByCreatedAtAsc(UUID threadId);
    }

    public interface ReportRepository extends JpaRepository<ContentReport, UUID> {
        Page<ContentReport> findByStatus(String status, Pageable pageable);

        List<ContentReport> findByTargetTypeAndTargetIdAndStatus(String targetType, UUID targetId, String status);
    }
}
