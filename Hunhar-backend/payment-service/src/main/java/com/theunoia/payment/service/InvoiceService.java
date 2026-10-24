package com.theunoia.payment.service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.payment.config.PaymentProperties;
import com.theunoia.payment.domain.Invoice;
import com.theunoia.payment.repository.PaymentRepositories.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

/** Automatic invoices (project payments, withdrawals, commission charges, credit purchases) + PDF rendering. */
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMM yyyy").withZone(ZoneId.of("Asia/Kolkata"));

    private final InvoiceRepository invoices;
    private final JdbcTemplate jdbc;
    private final EventPublisher events;
    private final PaymentProperties props;

    /** Idempotent per (type, reference, user). Amounts are tax-exclusive subtotal + tax. */
    @Transactional(propagation = Propagation.MANDATORY)
    public Invoice issue(Invoice.Type type, UUID userId, String refType, UUID refId, String description,
                         BigDecimal subtotal, BigDecimal taxRate) {
        return invoices.findByTypeAndReferenceIdAndUserId(type, refId, userId).orElseGet(() -> {
            Invoice inv = new Invoice();
            inv.setInvoiceNumber(jdbc.queryForObject("SELECT next_invoice_number(?)", String.class, props.getInvoicePrefix()));
            inv.setType(type);
            inv.setUserId(userId);
            inv.setReferenceType(refType);
            inv.setReferenceId(refId);
            inv.setDescription(description);
            inv.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
            inv.setTaxRate(taxRate);
            inv.setTaxAmount(subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP));
            inv.setTotal(inv.getSubtotal().add(inv.getTaxAmount()));
            invoices.save(inv);
            // notification-service emails the copy ("Email Copy" invoice format)
            events.publish("invoice.generated", Map.of("invoiceId", inv.getId(), "invoiceNumber", inv.getInvoiceNumber(),
                    "userId", userId, "type", type.name(), "total", inv.getTotal(),
                    "downloadPath", "/api/v1/payments/invoices/" + inv.getId() + "/pdf"));
            return inv;
        });
    }

    @Transactional(readOnly = true)
    public PageResponse<Invoice> list(UUID userId, int page, int size) {
        var pageable = Pagination.of(page, size, org.springframework.data.domain.Sort.by("issuedAt").descending());
        return PageResponse.of(userId == null ? invoices.findAll(pageable) : invoices.findByUserId(userId, pageable), i -> i);
    }

    @Transactional(readOnly = true)
    public Invoice get(UUID id, AuthUser user) {
        Invoice inv = invoices.findById(id).orElseThrow(() -> ApiException.notFound("Invoice"));
        if (!user.isAdmin() && !inv.getUserId().equals(user.id())) throw ApiException.forbidden("Not your invoice");
        return inv;
    }

    public byte[] renderPdf(Invoice inv) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 48, 48, 56, 56);
        PdfWriter.getInstance(doc, out);
        doc.open();
        Font h1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font bold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10);

        doc.add(new Paragraph(props.getCompanyName(), h1));
        doc.add(new Paragraph(props.getCompanyAddress(), normal));
        if (props.getCompanyGstin() != null && !props.getCompanyGstin().isBlank()) {
            doc.add(new Paragraph("GSTIN: " + props.getCompanyGstin(), normal));
        }
        doc.add(new Paragraph(" "));
        doc.add(new Paragraph(title(inv.getType()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));
        doc.add(new Paragraph("Invoice No: " + inv.getInvoiceNumber(), bold));
        doc.add(new Paragraph("Date: " + DATE.format(inv.getIssuedAt()), normal));
        doc.add(new Paragraph("Billed to (user id): " + inv.getUserId(), normal));
        doc.add(new Paragraph("Reference: " + inv.getReferenceType() + " " + inv.getReferenceId(), normal));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(new float[]{6, 2});
        table.setWidthPercentage(100);
        header(table, "Description", bold);
        header(table, "Amount (" + inv.getCurrency() + ")", bold);
        row(table, inv.getDescription(), inv.getSubtotal(), normal);
        if (inv.getTaxAmount().signum() > 0) {
            row(table, "GST @ " + inv.getTaxRate().movePointRight(2).stripTrailingZeros().toPlainString() + "%", inv.getTaxAmount(), normal);
        }
        row(table, "Total", inv.getTotal(), bold);
        doc.add(table);
        doc.add(new Paragraph(" "));
        doc.add(new Paragraph("This is a computer generated invoice and does not require a signature.", normal));
        doc.close();
        return out.toByteArray();
    }

    private static String title(Invoice.Type type) {
        return switch (type) {
            case PROJECT_PAYMENT -> "PAYMENT RECEIPT - PROJECT ESCROW DEPOSIT";
            case WITHDRAWAL -> "PAYOUT STATEMENT - WALLET WITHDRAWAL";
            case COMMISSION -> "TAX INVOICE - PLATFORM COMMISSION";
            case CREDIT_PURCHASE -> "TAX INVOICE - CREDIT PURCHASE";
        };
    }

    private static void header(PdfPTable t, String text, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(text, f));
        c.setPadding(6);
        t.addCell(c);
    }

    private static void row(PdfPTable t, String label, BigDecimal amount, Font f) {
        PdfPCell l = new PdfPCell(new Phrase(label, f));
        l.setPadding(6);
        PdfPCell a = new PdfPCell(new Phrase(amount.setScale(2, RoundingMode.HALF_UP).toPlainString(), f));
        a.setPadding(6);
        a.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(l);
        t.addCell(a);
    }
}
