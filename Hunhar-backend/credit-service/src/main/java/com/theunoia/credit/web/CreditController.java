package com.theunoia.credit.web;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.credit.domain.CreditPackage;
import com.theunoia.credit.repository.CreditRepositories.CreditPackageRepository;
import com.theunoia.credit.repository.LedgerRepository;
import com.theunoia.credit.repository.LedgerRepository.Applied;
import com.theunoia.credit.service.CreditService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CreditController {

    private final CreditService credits;
    private final LedgerRepository ledger;
    private final CreditPackageRepository packages;

    public record PurchaseRequest(@NotNull UUID packageId) {
    }

    public record AllocationRequest(@NotNull UUID userId, int amount, @NotBlank @Size(max = 300) String note) {
    }

    public record PackageRequest(@NotBlank @Size(max = 100) String name, @Min(1) int credits, @Min(0) int bonusCredits,
                                 @NotNull @DecimalMin("1.00") BigDecimal price, boolean active, int position) {
    }

    public record LedgerRequest(@NotNull UUID userId, @Min(1) int amount, @NotBlank @Size(max = 150) String idempotencyKey,
                                @Size(max = 120) String reference, @Size(max = 300) String description) {
    }

    // ------------------------------------------------------------------ user

    @GetMapping("/api/v1/credits/me")
    public Map<String, Object> myAccount() {
        return ledger.account(CurrentUser.require().id());
    }

    @GetMapping("/api/v1/credits/me/transactions")
    public PageResponse<Map<String, Object>> myTransactions(@RequestParam(required = false) String type,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "20") int size) {
        return ledger.transactions(CurrentUser.require().id(), type, page, size);
    }

    @GetMapping("/api/v1/credits/packages")
    public List<CreditPackage> packages() {
        return credits.activePackages();
    }

    @PostMapping("/api/v1/credits/purchase")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER')")
    public Map<String, Object> purchase(@Valid @RequestBody PurchaseRequest req) {
        return credits.startPurchase(CurrentUser.require().id(), req.packageId());
    }

    // ------------------------------------------------------------------ admin

    @PostMapping("/api/v1/admin/credits/allocate")
    @PreAuthorize("hasRole('ADMIN')")
    public Applied allocate(@Valid @RequestBody AllocationRequest req) {
        return credits.adminAdjust(CurrentUser.require().id(), req.userId(), req.amount(), req.note());
    }

    @GetMapping("/api/v1/admin/credits/accounts/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> account(@PathVariable UUID userId) {
        return ledger.account(userId);
    }

    @GetMapping("/api/v1/admin/credits/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<Map<String, Object>> transactions(@RequestParam(required = false) UUID userId,
                                                          @RequestParam(required = false) String type,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "50") int size) {
        return ledger.transactions(userId, type, page, size);
    }

    @GetMapping("/api/v1/admin/credits/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> summary() {
        return ledger.summary();
    }

    @GetMapping("/api/v1/admin/credits/packages")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CreditPackage> allPackages() {
        return packages.findAll();
    }

    @PostMapping("/api/v1/admin/credits/packages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CreditPackage createPackage(@Valid @RequestBody PackageRequest req) {
        return packages.save(apply(new CreditPackage(), req));
    }

    @PutMapping("/api/v1/admin/credits/packages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public CreditPackage updatePackage(@PathVariable UUID id, @Valid @RequestBody PackageRequest req) {
        return apply(packages.findById(id).orElseThrow(() -> ApiException.notFound("Credit package")), req);
    }

    // ------------------------------------------------------------------ internal (project-service)

    @PostMapping("/internal/credits/debit")
    public Applied debit(@Valid @RequestBody LedgerRequest req) {
        return credits.debitForBid(req.userId(), req.amount(), req.idempotencyKey(), req.reference(), req.description());
    }

    @PostMapping("/internal/credits/refund")
    public Applied refund(@Valid @RequestBody LedgerRequest req) {
        return credits.refundBid(req.userId(), req.amount(), req.idempotencyKey(), req.reference(), req.description());
    }

    private static CreditPackage apply(CreditPackage p, PackageRequest req) {
        p.setName(req.name());
        p.setCredits(req.credits());
        p.setBonusCredits(req.bonusCredits());
        p.setPrice(req.price());
        p.setActive(req.active());
        p.setPosition(req.position());
        return p;
    }
}
