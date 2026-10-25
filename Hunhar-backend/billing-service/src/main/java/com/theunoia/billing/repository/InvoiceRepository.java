package com.theunoia.billing.repository;

import com.theunoia.billing.domain.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByClientId(UUID clientId);
    List<Invoice> findByFreelancerId(UUID freelancerId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
