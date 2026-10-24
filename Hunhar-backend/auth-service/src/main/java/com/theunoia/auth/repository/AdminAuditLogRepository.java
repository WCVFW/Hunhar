package com.theunoia.auth.repository;

import com.theunoia.auth.domain.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    List<AdminAuditLog> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId);
}
