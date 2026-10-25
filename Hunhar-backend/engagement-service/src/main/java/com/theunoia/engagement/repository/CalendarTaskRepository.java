package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.CalendarTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarTaskRepository extends JpaRepository<CalendarTask, UUID> {

    @Query("SELECT t FROM CalendarTask t WHERE t.userId = :userId AND " +
            "((t.dueAt >= :from AND t.dueAt < :to) OR (:includeUndated = true AND t.dueAt IS NULL)) " +
            "ORDER BY t.dueAt ASC, t.createdAt ASC")
    List<CalendarTask> findInRange(@Param("userId") UUID userId,
                                   @Param("from") Instant from,
                                   @Param("to") Instant to,
                                   @Param("includeUndated") boolean includeUndated);

    List<CalendarTask> findByUserIdAndDueAtIsNullOrderByCreatedAtAsc(UUID userId);

    long countByUserIdAndStatusNot(UUID userId, CalendarTask.Status status);

    long countByUserIdAndStatus(UUID userId, CalendarTask.Status status);

    long countByUserIdAndStatusNotAndDueAtLessThan(UUID userId, CalendarTask.Status status, Instant now);

    List<CalendarTask> findTop200ByRemindAtLessThanEqualOrderByRemindAtAsc(Instant now);
}
