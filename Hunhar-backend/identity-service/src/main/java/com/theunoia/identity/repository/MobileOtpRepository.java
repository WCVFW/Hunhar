package com.theunoia.identity.repository;

import com.theunoia.identity.domain.MobileOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MobileOtpRepository extends JpaRepository<MobileOtp, UUID> {
    Optional<MobileOtp> findByMobile(String mobile);
}
