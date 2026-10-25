package com.theunoia.identity.repository;

import com.theunoia.identity.domain.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, UUID> {
    Optional<EmailOtp> findByEmail(String email);
    void deleteByEmail(String email);
}
