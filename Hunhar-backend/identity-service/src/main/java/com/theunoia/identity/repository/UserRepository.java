package com.theunoia.identity.repository;

import com.theunoia.identity.domain.User;
import com.theunoia.identity.domain.UserRole;
import com.theunoia.identity.domain.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByMobile(String mobile);
    List<User> findByStatus(UserStatus status);
    List<User> findByRole(UserRole role);
    List<User> findByKycStatusOrderByKycSubmittedAtAsc(com.theunoia.identity.domain.KycStatus status);
    List<User> findByKycStatusNotOrderByKycSubmittedAtDesc(com.theunoia.identity.domain.KycStatus status);
    long countByRole(UserRole role);
    long countByStatus(UserStatus status);
    long countByKycStatus(com.theunoia.identity.domain.KycStatus status);
    long countByCreatedAtBetween(java.time.Instant from, java.time.Instant to);
    boolean existsByRole(UserRole role);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "(:role IS NULL OR u.role = :role) AND (:status IS NULL OR u.status = :status) AND " +
            "(:search IS NULL OR LOWER(u.fullName) LIKE CONCAT('%', :search, '%') OR LOWER(u.email) LIKE CONCAT('%', :search, '%') OR u.mobile LIKE CONCAT('%', :search, '%')) " +
            "ORDER BY u.createdAt DESC")
    List<User> adminSearch(@org.springframework.data.repository.query.Param("role") UserRole role,
                           @org.springframework.data.repository.query.Param("status") UserStatus status,
                           @org.springframework.data.repository.query.Param("search") String search,
                           org.springframework.data.domain.Pageable pageable);
}
