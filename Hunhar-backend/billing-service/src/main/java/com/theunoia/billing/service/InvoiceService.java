package com.theunoia.billing.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.billing.domain.Invoice;
import com.theunoia.billing.repository.InvoiceRepository;
import com.theunoia.common.internal.UserDirectoryClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Creates invoices (with their PDF) for every completed payment:
 * MILESTONE (escrow released), CREDIT_PURCHASE (credit pack) and WALLET_TOPUP.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    public static final String TYPE_MILESTONE = "MILESTONE";
    public static final String TYPE_CREDITS = "CREDIT_PURCHASE";
    public static final String TYPE_TOPUP = "WALLET_TOPUP";

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final Color BRAND = new Color(0xC0, 0x6B, 0x3E);
    private static final Color NAVY = new Color(0x08, 0x18, 0x2B);
    private static final Color MUTED = new Color(0x64, 0x74, 0x8B);
    private static final Color LINE = new Color(0xE2, 0xE8, 0xF0);

    private final InvoiceRepository invoiceRepository;
    private final UserDirectoryClient userDirectory;

    public Invoice generateMilestoneInvoice(
            UUID clientId,
            UUID freelancerId,
            UUID projectId,
            UUID milestoneId,
            String description,
            BigDecimal grossAmount,
            BigDecimal commissionRate
    ) {
        BigDecimal commission = grossAmount.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gst = commission.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP); // 18% GST on platform fee
        BigDecimal netPayout = grossAmount.subtract(commission);
        String percent = commissionRate.multiply(BigDecimal.valueOf(100)).stripTrailingZeros().toPlainString();

        Invoice invoice = Invoice.builder()
                .invoiceNumber(newNumber())
                .type(TYPE_MILESTONE)
                .clientId(clientId)
                .freelancerId(freelancerId)
                .projectId(projectId)
                .milestoneId(milestoneId)
                .description(truncate("Milestone: " + description, 150))
                .grossAmount(grossAmount)
                .commissionAmount(commission)
                .gstAmount(gst)
                .netPayoutToFreelancer(netPayout)
                .paymentMethod("ESCROW")
                .build();

        var users = userDirectory.lookup(List.of(clientId, freelancerId));
        var client = users.get(clientId);
        var freelancer = users.get(freelancerId);
        List<String[]> lines = new ArrayList<>();
        lines.add(new String[]{"Milestone amount (paid by client)", rupees(grossAmount)});
        lines.add(new String[]{"Platform fee (" + percent + "%) - incl. GST " + rupees(gst), "- " + rupees(commission)});
        invoice.setPdfContent(renderPdf(invoice, "TAX INVOICE",
                client != null ? client.fullName() : "Client", client != null ? client.email() : null,
                "Freelancer: " + (freelancer != null ? freelancer.fullName() : "-"),
                lines, "Freelancer receives", netPayout));
        return invoiceRepository.save(invoice);
    }

    /** Receipt for something the user paid for directly (credit pack or wallet top-up). */
    public Invoice generatePaymentInvoice(UUID userId, String type, String description, BigDecimal amount,
                                          String paymentRef, String paymentMethod) {
        Invoice invoice = Invoice.builder()
                .invoiceNumber(newNumber())
                .type(type)
                // The payer is stored on both sides so it appears in their invoice list whatever their role
                .clientId(userId)
                .freelancerId(userId)
                .description(truncate(description, 150))
                .grossAmount(amount)
                .commissionAmount(BigDecimal.ZERO)
                .gstAmount(BigDecimal.ZERO)
                .netPayoutToFreelancer(amount)
                .paymentRef(truncate(paymentRef, 100))
                .paymentMethod(paymentMethod)
                .build();

        var user = userDirectory.lookup(List.of(userId)).get(userId);
        List<String[]> lines = new ArrayList<>();
        lines.add(new String[]{description, rupees(amount)});
        invoice.setPdfContent(renderPdf(invoice, TYPE_TOPUP.equals(type) ? "PAYMENT RECEIPT" : "INVOICE",
                user != null ? user.fullName() : "Customer", user != null ? user.email() : null,
                null, lines, "Total paid", amount));
        return invoiceRepository.save(invoice);
    }

    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));
    }

    private static String newNumber() {
        return "INV-" + DateTimeFormatter.ofPattern("yyyyMM").withZone(IST).format(Instant.now())
                + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    static String rupees(BigDecimal v) {
        return "Rs. " + String.format("%,.2f", v.setScale(2, RoundingMode.HALF_UP));
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }

    private static String methodLabel(String method) {
        if (method == null) return "-";
        return switch (method) {
            case "RAZORPAY" -> "Razorpay (UPI / Card / Net banking)";
            case "WALLET" -> "Hunhar wallet balance";
            case "ESCROW" -> "Released from escrow";
            case "SIMULATED" -> "Test mode (no real money)";
            default -> method;
        };
    }

    private byte[] renderPdf(Invoice inv, String title, String billedName, String billedEmail, String extraParty,
                             List<String[]> lines, String totalLabel, BigDecimal total) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 42, 42, 48, 42);
            PdfWriter.getInstance(document, out);
            document.open();

            Font brand = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, BRAND);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, NAVY);
            Font label = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);
            Font body = FontFactory.getFont(FontFactory.HELVETICA, 10.5f, NAVY);
            Font bold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, NAVY);
            Font totalFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, NAVY);

            PdfPTable head = new PdfPTable(new float[]{1.2f, 1f});
            head.setWidthPercentage(100);
            PdfPCell left = cell(new Paragraph("hunhar", brand), Element.ALIGN_LEFT);
            left.addElement(new Paragraph("Freelance marketplace · hunhar.in", label));
            head.addCell(left);
            PdfPCell right = cell(new Paragraph(title, titleFont), Element.ALIGN_RIGHT);
            Paragraph meta = new Paragraph();
            meta.setAlignment(Element.ALIGN_RIGHT);
            meta.add(new Chunk("Invoice no.  ", label));
            meta.add(new Chunk(inv.getInvoiceNumber() + "\n", bold));
            meta.add(new Chunk("Date  ", label));
            meta.add(new Chunk(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(IST).format(Instant.now()) + " IST\n", body));
            meta.add(new Chunk("Status  ", label));
            meta.add(new Chunk("PAID", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, new Color(0x16, 0xA3, 0x4A))));
            right.addElement(meta);
            head.addCell(right);
            document.add(head);
            document.add(separator());

            Paragraph billed = new Paragraph();
            billed.add(new Chunk("BILLED TO\n", label));
            billed.add(new Chunk(billedName + "\n", bold));
            if (billedEmail != null) billed.add(new Chunk(billedEmail + "\n", body));
            if (extraParty != null) billed.add(new Chunk(extraParty + "\n", body));
            billed.add(new Chunk("\nPAYMENT\n", label));
            billed.add(new Chunk(methodLabel(inv.getPaymentMethod()) + (inv.getPaymentRef() != null ? "  ·  Ref " + inv.getPaymentRef() : "") + "\n", body));
            billed.setSpacingAfter(14);
            document.add(billed);

            PdfPTable table = new PdfPTable(new float[]{3.2f, 1.2f});
            table.setWidthPercentage(100);
            table.addCell(headerCell("Description", Element.ALIGN_LEFT));
            table.addCell(headerCell("Amount", Element.ALIGN_RIGHT));
            for (String[] row : lines) {
                table.addCell(rowCell(row[0], body, Element.ALIGN_LEFT));
                table.addCell(rowCell(row[1], body, Element.ALIGN_RIGHT));
            }
            PdfPCell tl = rowCell(totalLabel, totalFont, Element.ALIGN_LEFT);
            PdfPCell tv = rowCell(rupees(total), totalFont, Element.ALIGN_RIGHT);
            tl.setBorderWidthTop(1.2f);
            tv.setBorderWidthTop(1.2f);
            table.addCell(tl);
            table.addCell(tv);
            document.add(table);

            Paragraph foot = new Paragraph("\nThank you for using Hunhar. This is a computer-generated document and needs no signature.\n"
                    + "Questions about this invoice? Write to howdy@theunoia.com with the invoice number.", label);
            foot.setAlignment(Element.ALIGN_CENTER);
            foot.setSpacingBefore(24);
            document.add(foot);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF invoice {}", inv.getInvoiceNumber(), e);
            return new byte[0];
        }
    }

    private static PdfPCell cell(Paragraph p, int align) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        p.setAlignment(align);
        c.addElement(p);
        return c;
    }

    private static Paragraph separator() {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(4);
        PdfPTable line = new PdfPTable(1);
        line.setWidthPercentage(100);
        PdfPCell c = new PdfPCell(new Phrase(" "));
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(LINE);
        c.setFixedHeight(6);
        line.addCell(c);
        p.add(line);
        return p;
    }

    private static PdfPCell headerCell(String text, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, Color.WHITE)));
        c.setBackgroundColor(NAVY);
        c.setHorizontalAlignment(align);
        c.setPadding(8);
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private static PdfPCell rowCell(String text, Font font, int align) {
        PdfPCell c = new PdfPCell(new Phrase(text, font));
        c.setHorizontalAlignment(align);
        c.setPadding(8);
        c.setBorder(Rectangle.BOTTOM);
        c.setBorderColor(LINE);
        return c;
    }
}
