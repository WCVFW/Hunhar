package com.theunoia.notification.repository;

import com.theunoia.notification.domain.NotificationEntities.CalendarEvent;
import com.theunoia.notification.domain.NotificationEntities.Campaign;
import com.theunoia.notification.domain.NotificationEntities.GoogleConnection;
import com.theunoia.notification.domain.NotificationEntities.Notification;
import com.theunoia.notification.domain.NotificationEntities.UserContact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class NotificationRepositories {

    private NotificationRepositories() {
    }

    public interface UserContactRepository extends JpaRepository<UserContact, UUID> {
        @Query("SELECT c FROM UserContact c WHERE c.marketingOptIn = true AND c.whatsappEnabled = true AND (:role = 'ALL' OR c.role = :role)")
        List<UserContact> marketingAudience(@Param("role") String role);
    }

    public interface NotificationRepository extends JpaRepository<Notification, UUID> {
        Page<Notification> findByUserId(UUID userId, Pageable pageable);

        Page<Notification> findByUserIdAndReadAtIsNull(UUID userId, Pageable pageable);

        long countByUserIdAndReadAtIsNull(UUID userId);

        Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

        @Modifying
        @Query("UPDATE Notification n SET n.readAt = CURRENT_TIMESTAMP WHERE n.userId = :userId AND n.readAt IS NULL")
        int markAllRead(@Param("userId") UUID userId);
    }

    public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {
        Optional<CalendarEvent> findBySourceKey(String sourceKey);

        @Query("""
                SELECT DISTINCT e FROM CalendarEvent e LEFT JOIN e.attendees a
                WHERE (e.ownerId = :userId OR a = :userId) AND e.startAt >= :from AND e.startAt < :to
                ORDER BY e.startAt""")
        List<CalendarEvent> forUser(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);
    }

    public interface GoogleConnectionRepository extends JpaRepository<GoogleConnection, UUID> {
    }

    public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    }
}
