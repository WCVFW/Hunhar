package com.theunoia.payment.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.payment.domain.DirectPayment;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.domain.PayoutAccount;
import com.theunoia.payment.domain.Refund;
import com.theunoia.payment.domain.Withdrawal;
import com.theunoia.payment.service.EscrowService;
import com.theunoia.payment.service.InvoiceService;
import com.theunoia.payment.service.LedgerService;
import com.theunoia.payment.service.PaymentService;
import com.theunoia.payment.service.WalletService;
import com.theunoia.payment.service.WithdrawalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService payments;
    private final EscrowService escrow;
    private final WithdrawalService withdrawals;
    private final WalletService wallets;
    private final InvoiceService invoices;
    private final LedgerService ledger;

    public record MilestoneOrderRequest(@NotNull UUID milestoneId) {
    }

    public record VerifyRequest(@NotNull UUID orderId, @NotBlank String providerPaymentId, @NotBlank String signature) {
    }

    public record RefundRequest(@NotNull UUID escrowId, @NotBlank @Size(max = 500) String reason) {
    }

    public record WithdrawalRequest(@NotNull UUID payoutAccountId, @NotNull @DecimalMin("1.00") BigDecimal amount) {
    }

    public record PayoutAccountBody(@NotNull PayoutAccount.Type type, @NotBlank @Size(max = 150) String accountHolderName,
                                    @Size(max = 18) String accountNumber, @Size(max = 11) String ifsc,
                                    @Size(max = 100) String upiId, boolean makeDefault) {
    }

    public record DirectPaymentRequest(@NotNull UUID projectId, @NotNull @DecimalMin("1.00") BigDecimal amount,
                                       @NotBlank @Size(max = 30) String method, @Size(max = 120) String reference,
                                       @Size(max = 500) String note) {
    }

    // ------------------------------------------------------------------ platform payments (escrow)

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENT') and hasAuthority('STATUS_ACTIVE')")
    public Map<String, Object> fundMilestone(@Valid @RequestBody MilestoneOrderRequest req) {
        return payments.createMilestoneOrder(CurrentUser.require(), req.milestoneId());
    }

    @GetMapping("/orders/{id}")
    public PaymentOrder order(@PathVariable UUID id) {
        return payments.get(id, CurrentUser.require());
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody VerifyRequest req) {
        return payments.verifyCheckout(CurrentUser.require(), req.orderId(), req.providerPaymentId(), req.signature());
    }

    /** Development only (provider=mock): simulates a successful checkout. */
    @PostMapping("/mock/{orderId}/capture")
    public Map<String, Object> mockCapture(@PathVariable UUID orderId) {
        return payments.mockCapture(CurrentUser.require(), orderId);
    }

    @PostMapping("/refunds")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENT')")
    public Refund requestRefund(@Valid @RequestBody RefundRequest req) {
        return escrow.requestRefund(CurrentUser.require(), req.escrowId(), req.reason());
    }

    // ------------------------------------------------------------------ direct payments

    @PostMapping("/direct")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CLIENT')")
    public DirectPayment recordDirect(@Valid @RequestBody DirectPaymentRequest req) {
        return wallets.recordDirect(CurrentUser.require(), req.projectId(), req.amount(), req.method(), req.reference(), req.note());
    }

    @PostMapping("/direct/{id}/confirm")
    @PreAuthorize("hasRole('FREELANCER')")
    public DirectPayment confirmDirect(@PathVariable UUID id) {
        return wallets.confirmDirect(CurrentUser.require(), id, true);
    }

    @PostMapping("/direct/{id}/dispute")
    @PreAuthorize("hasRole('FREELANCER')")
    public DirectPayment disputeDirect(@PathVariable UUID id) {
        return wallets.confirmDirect(CurrentUser.require(), id, false);
    }

    @GetMapping("/direct")
    public List<DirectPayment> directForProject(@RequestParam UUID projectId) {
        return wallets.directForProject(CurrentUser.require(), projectId);
    }

    // ------------------------------------------------------------------ wallet

    @GetMapping("/wallet")
    public Map<String, Object> wallet() {
        return wallets.wallet(CurrentUser.require());
    }

    @GetMapping("/transactions")
    public PageResponse<Map<String, Object>> transactions(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return ledger.history(CurrentUser.require().id(), page, size);
    }

    @PostMapping("/payout-accounts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER')")
    public PayoutAccount addPayoutAccount(@Valid @RequestBody PayoutAccountBody req) {
        return withdrawals.addAccount(CurrentUser.require(), new WithdrawalService.PayoutAccountRequest(req.type(),
                req.accountHolderName(), req.accountNumber(), req.ifsc(), req.upiId(), req.makeDefault()));
    }

    @GetMapping("/payout-accounts")
    public List<PayoutAccount> payoutAccounts() {
        return withdrawals.myAccounts(CurrentUser.require());
    }

    @DeleteMapping("/payout-accounts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePayoutAccount(@PathVariable UUID id) {
        withdrawals.removeAccount(CurrentUser.require(), id);
    }

    @PostMapping("/withdrawals")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('FREELANCER') and hasAuthority('STATUS_ACTIVE')")
    public Withdrawal withdraw(@Valid @RequestBody WithdrawalRequest req) {
        return withdrawals.request(CurrentUser.require(), req.payoutAccountId(), req.amount());
    }

    @GetMapping("/withdrawals")
    public PageResponse<Withdrawal> myWithdrawals(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return withdrawals.mine(CurrentUser.require(), page, size);
    }

    // ------------------------------------------------------------------ invoices

    @GetMapping("/invoices")
    public PageResponse<Invoice> invoices(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return invoices.list(CurrentUser.require().id(), page, size);
    }

    @GetMapping("/invoices/{id}")
    public Invoice invoice(@PathVariable UUID id) {
        return invoices.get(id, CurrentUser.require());
    }

    @GetMapping("/invoices/{id}/pdf")
    public ResponseEntity<byte[]> invoicePdf(@PathVariable UUID id) {
        Invoice inv = invoices.get(id, CurrentUser.require());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(inv.getInvoiceNumber().replace('/', '-') + ".pdf").build().toString())
                .body(invoices.renderPdf(inv));
    }
}
