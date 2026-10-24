package com.theunoia.payment.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.payment.domain.EscrowHolding;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.domain.PaymentOrder;
import com.theunoia.payment.domain.Refund;
import com.theunoia.payment.domain.Withdrawal;
import com.theunoia.payment.domain.PaymentOrder.Status;
import com.theunoia.payment.repository.PaymentRepositories.PaymentOrderRepository;
import com.theunoia.payment.service.EscrowService;
import com.theunoia.payment.service.InvoiceService;
import com.theunoia.payment.service.LedgerService;
import com.theunoia.payment.service.WalletService;
import com.theunoia.payment.service.WithdrawalService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Admin panel - payment management: monitoring, commission tracking, payout approval, refunds. */
@RestController
@RequestMapping("/api/v1/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentOrderRepository orders;
    private final EscrowService escrow;
    private final WithdrawalService withdrawals;
    private final WalletService wallets;
    private final LedgerService ledger;
    private final InvoiceService invoices;

    public record NoteRequest(@Size(max = 500) String note) {
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return wallets.platformSummary();
    }

    @GetMapping("/orders")
    public PageResponse<PaymentOrder> orders(@RequestParam(required = false) Status status,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "50") int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? orders.findAll(pageable) : orders.findByStatus(status, pageable), o -> o);
    }

    @GetMapping("/transactions")
    public PageResponse<Map<String, Object>> transactions(@RequestParam(required = false) UUID userId,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "50") int size) {
        return ledger.history(userId, page, size);
    }

    @GetMapping("/escrows")
    public PageResponse<EscrowHolding> escrows(@RequestParam(required = false) EscrowHolding.Status status,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "50") int size) {
        return escrow.listEscrows(status, page, size);
    }

    @GetMapping("/commissions/monthly")
    public List<Map<String, Object>> commissions(@RequestParam(defaultValue = "12") int months) {
        return ledger.monthlyRevenue(Math.min(months, 36));
    }

    @GetMapping("/withdrawals")
    public PageResponse<Withdrawal> withdrawals(@RequestParam(required = false) Withdrawal.Status status,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "50") int size) {
        return withdrawals.list(status, page, size);
    }

    @PostMapping("/withdrawals/{id}/approve")
    public Withdrawal approveWithdrawal(@PathVariable UUID id) {
        return withdrawals.approve(CurrentUser.require(), id);
    }

    @PostMapping("/withdrawals/{id}/reject")
    public Withdrawal rejectWithdrawal(@PathVariable UUID id, @RequestBody(required = false) NoteRequest req) {
        return withdrawals.reject(CurrentUser.require(), id, req == null ? null : req.note());
    }

    @GetMapping("/refunds")
    public PageResponse<Refund> refunds(@RequestParam(required = false) Refund.Status status,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "50") int size) {
        return escrow.listRefunds(status, page, size);
    }

    @PostMapping("/refunds/{id}/approve")
    public Refund approveRefund(@PathVariable UUID id) {
        return escrow.approveRefund(CurrentUser.require(), id);
    }

    @PostMapping("/refunds/{id}/reject")
    public Refund rejectRefund(@PathVariable UUID id, @RequestBody(required = false) NoteRequest req) {
        return escrow.rejectRefund(CurrentUser.require(), id, req == null ? null : req.note());
    }

    @GetMapping("/invoices")
    public PageResponse<Invoice> invoices(@RequestParam(required = false) UUID userId,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "50") int size) {
        return invoices.list(userId, page, size);
    }
}
