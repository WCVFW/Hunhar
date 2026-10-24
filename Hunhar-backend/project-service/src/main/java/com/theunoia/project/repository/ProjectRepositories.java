package com.theunoia.project.repository;

import com.theunoia.project.domain.Bid;
import com.theunoia.project.domain.Category;
import com.theunoia.project.domain.Deliverable;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.domain.Milestone;
import com.theunoia.project.domain.Project;
import com.theunoia.project.domain.ProjectAttachment;
import com.theunoia.project.domain.ProjectUpdate;
import com.theunoia.project.domain.Review;
import com.theunoia.project.domain.TeamMember;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class ProjectRepositories {

    private ProjectRepositories() {
    }

    public interface CategoryRepository extends JpaRepository<Category, UUID> {
        List<Category> findByActiveTrueOrderByPositionAscNameAsc();

        boolean existsBySlug(String slug);
    }

    public interface ProjectRepository extends JpaRepository<Project, UUID> {
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT p FROM Project p WHERE p.id = :id")
        Optional<Project> findByIdForUpdate(@Param("id") UUID id);

        Page<Project> findByClientIdAndStatusIn(UUID clientId, Collection<Project.Status> statuses, Pageable pageable);

        Page<Project> findByClientId(UUID clientId, Pageable pageable);

        Page<Project> findByFreelancerIdAndStatusIn(UUID freelancerId, Collection<Project.Status> statuses, Pageable pageable);

        Page<Project> findByFreelancerId(UUID freelancerId, Pageable pageable);

        @Query("""
                SELECT p FROM Project p WHERE (:status IS NULL OR p.status = :status)
                  AND (:clientId IS NULL OR p.clientId = :clientId)""")
        Page<Project> adminSearch(@Param("status") Project.Status status, @Param("clientId") UUID clientId, Pageable pageable);

        long countByClientIdAndStatus(UUID clientId, Project.Status status);

        long countByFreelancerIdAndStatus(UUID freelancerId, Project.Status status);

        long countByStatus(Project.Status status);

        @Query("SELECT p.id FROM Project p JOIN TeamMember t ON t.projectId = p.id WHERE t.memberId = :memberId AND t.status = 'ACCEPTED'")
        List<UUID> findTeamProjectIds(@Param("memberId") UUID memberId);
    }

    public interface AttachmentRepository extends JpaRepository<ProjectAttachment, UUID> {
        List<ProjectAttachment> findByProjectIdOrderByCreatedAtAsc(UUID projectId);
    }

    public interface BidRepository extends JpaRepository<Bid, UUID> {
        Optional<Bid> findByProjectIdAndFreelancerId(UUID projectId, UUID freelancerId);

        List<Bid> findByProjectIdAndStatusIn(UUID projectId, Collection<Bid.Status> statuses);

        Page<Bid> findByProjectId(UUID projectId, Pageable pageable);

        Page<Bid> findByFreelancerId(UUID freelancerId, Pageable pageable);

        Page<Bid> findByFreelancerIdAndStatus(UUID freelancerId, Bid.Status status, Pageable pageable);

        long countByFreelancerIdAndStatusIn(UUID freelancerId, Collection<Bid.Status> statuses);

        @Modifying
        @Query("UPDATE Bid b SET b.status = 'REJECTED' WHERE b.projectId = :projectId AND b.id <> :acceptedId AND b.status IN ('SUBMITTED', 'SHORTLISTED')")
        int rejectOthers(@Param("projectId") UUID projectId, @Param("acceptedId") UUID acceptedId);

        @Query("SELECT count(b) FROM Bid b JOIN Project p ON p.id = b.projectId WHERE p.clientId = :clientId AND b.status IN ('SUBMITTED', 'SHORTLISTED') AND p.status = 'OPEN'")
        long countOpenBidsForClient(@Param("clientId") UUID clientId);
    }

    public interface MilestoneRepository extends JpaRepository<Milestone, UUID> {
        List<Milestone> findByProjectIdOrderByPositionAsc(UUID projectId);

        int countByProjectId(UUID projectId);

        @Query("""
                SELECT m FROM Milestone m JOIN Project p ON p.id = m.projectId
                WHERE p.freelancerId = :freelancerId AND m.dueDate IS NOT NULL AND m.dueDate <= :until
                  AND m.status IN ('PENDING', 'FUNDED', 'REVISION_REQUESTED') ORDER BY m.dueDate ASC""")
        List<Milestone> upcomingForFreelancer(@Param("freelancerId") UUID freelancerId, @Param("until") LocalDate until);

        @Query("""
                SELECT m FROM Milestone m JOIN Project p ON p.id = m.projectId
                WHERE p.clientId = :clientId AND m.status = 'SUBMITTED' ORDER BY m.submittedAt ASC""")
        List<Milestone> awaitingClientReview(@Param("clientId") UUID clientId);
    }

    public interface DeliverableRepository extends JpaRepository<Deliverable, UUID> {
        List<Deliverable> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

        Optional<Deliverable> findFirstByMilestoneIdOrderByCreatedAtDesc(UUID milestoneId);
    }

    public interface ProjectUpdateRepository extends JpaRepository<ProjectUpdate, UUID> {
        List<ProjectUpdate> findTop50ByProjectIdOrderByCreatedAtDesc(UUID projectId);
    }

    public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
        List<TeamMember> findByProjectId(UUID projectId);

        Optional<TeamMember> findByProjectIdAndMemberId(UUID projectId, UUID memberId);

        List<TeamMember> findByMemberIdAndStatus(UUID memberId, TeamMember.Status status);

        boolean existsByProjectIdAndMemberIdAndStatus(UUID projectId, UUID memberId, TeamMember.Status status);
    }

    public interface ReviewRepository extends JpaRepository<Review, UUID> {
        Page<Review> findByRevieweeId(UUID revieweeId, Pageable pageable);

        boolean existsByProjectIdAndReviewerId(UUID projectId, UUID reviewerId);

        List<Review> findByProjectId(UUID projectId);
    }

    public interface DisputeRepository extends JpaRepository<Dispute, UUID> {
        Page<Dispute> findByStatus(Dispute.Status status, Pageable pageable);

        List<Dispute> findByProjectIdOrderByCreatedAtDesc(UUID projectId);

        boolean existsByProjectIdAndStatusNot(UUID projectId, Dispute.Status status);
    }
}
