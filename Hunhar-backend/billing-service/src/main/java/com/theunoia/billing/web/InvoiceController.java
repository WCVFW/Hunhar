package com.theunoia.billing.web;

import com.theunoia.billing.domain.Invoice;
import com.theunoia.billing.repository.InvoiceRepository;
import com.theunoia.billing.service.InvoiceService;
import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.exception.UnauthorizedException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;

    /** Only the client, the freelancer on the invoice, or an admin can download it. */
    @GetMapping("/{invoiceNumber}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@CurrentUser AuthUser currentUser, @PathVariable String invoiceNumber) {
        AuthUser user = requireUser(currentUser);
        Invoice invoice = invoiceService.getInvoiceByNumber(invoiceNumber);
        if (!user.hasRole("ADMIN") && !user.id().equals(invoice.getClientId()) && !user.id().equals(invoice.getFreelancerId())) {
            throw new ForbiddenException("You cannot download this invoice");
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoiceNumber + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(invoice.getPdfContent());
    }

    @GetMapping("/client/my-invoices")
    public ResponseEntity<ApiResponse<List<Invoice>>> getClientInvoices(@CurrentUser AuthUser currentUser) {
        List<Invoice> list = invoiceRepository.findByClientId(requireUser(currentUser).id());
        list.sort(Comparator.comparing(Invoice::getCreatedAt).reversed());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/freelancer/my-invoices")
    public ResponseEntity<ApiResponse<List<Invoice>>> getFreelancerInvoices(@CurrentUser AuthUser currentUser) {
        List<Invoice> list = invoiceRepository.findByFreelancerId(requireUser(currentUser).id());
        list.sort(Comparator.comparing(Invoice::getCreatedAt).reversed());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    private static AuthUser requireUser(AuthUser user) {
        if (user == null) throw new UnauthorizedException("Authentication required");
        return user;
    }
}
