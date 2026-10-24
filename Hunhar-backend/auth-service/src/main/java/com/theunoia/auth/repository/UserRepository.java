package com.theunoia.auth.repository;

import com.theunoia.auth.domain.Role;
import com.theunoia.auth.domain.User;
import com.theunoia.auth.domain.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByMobile(String mobile);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (:status IS NULL OR u.status = :status)
              AND (:q IS NULL OR lower(u.displayName) LIKE lower(concat('%', CAST(:q AS string), '%'))
                   OR u.email LIKE lower(concat('%', CAST(:q AS string), '%')) OR u.mobile LIKE concat('%', CAST(:q AS string), '%'))
            """)
    Page<User> search(@Param("role") Role role, @Param("status") UserStatus status, @Param("q") String q, Pageable pageable);

    long countByRole(Role role);

    long countByStatus(UserStatus status);
}
