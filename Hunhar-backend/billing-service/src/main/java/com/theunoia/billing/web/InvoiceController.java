package com.theunoia.billing.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.billing.domain.Invoice;
import com.theunoia.billing.repository.InvoiceRepository;
import com.theunoia.billing.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;

    @GetMapping("/{invoiceNumber}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable String invoiceNumber) {
        Invoice invoice = invoiceService.getInvoiceByNumber(invoiceNumber);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoiceNumber + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(invoice.getPdfContent());
    }

    @GetMapping("/client/my-invoices")
    public ResponseEntity<ApiResponse<List<Invoice>>> getClientInvoices(@CurrentUser AuthUser currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        return ResponseEntity.ok(ApiResponse.ok(invoiceRepository.findByClientId(currentUser.id())));
    }

    @GetMapping("/freelancer/my-invoices")
    public ResponseEntity<ApiResponse<List<Invoice>>> getFreelancerInvoices(@CurrentUser AuthUser currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }
        return ResponseEntity.ok(ApiResponse.ok(invoiceRepository.findByFreelancerId(currentUser.id())));
    }
}
