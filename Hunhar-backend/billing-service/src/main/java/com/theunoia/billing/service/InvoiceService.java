package com.theunoia.billing.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.billing.domain.Invoice;
import com.theunoia.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    public Invoice generateMilestoneInvoice(
            UUID clientId,
            UUID freelancerId,
            UUID projectId,
            UUID milestoneId,
            String description,
            BigDecimal grossAmount
    ) {
        BigDecimal commission = grossAmount.multiply(new BigDecimal("0.10")); // 10% Platform fee
        BigDecimal gst = commission.multiply(new BigDecimal("0.18")); // 18% GST on platform fee
        BigDecimal netPayout = grossAmount.subtract(commission);

        String invoiceNumber = "INV-" + Instant.now().getEpochSecond() + "-" + (int)(Math.random() * 1000);

        byte[] pdfBytes = createPdf(invoiceNumber, description, grossAmount, commission, gst, netPayout);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(invoiceNumber)
                .clientId(clientId)
                .freelancerId(freelancerId)
                .projectId(projectId)
                .milestoneId(milestoneId)
                .description(description)
                .grossAmount(grossAmount)
                .commissionAmount(commission)
                .gstAmount(gst)
                .netPayoutToFreelancer(netPayout)
                .pdfContent(pdfBytes)
                .build();

        return invoiceRepository.save(invoice);
    }

    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNumber));
    }

    private byte[] createPdf(
            String invoiceNumber,
            String description,
            BigDecimal gross,
            BigDecimal commission,
            BigDecimal gst,
            BigDecimal net
    ) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph header = new Paragraph("THEUNOiA FREELANCE PLATFORM - INVOICE", headerFont);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(20);
            document.add(header);

            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            document.add(new Paragraph("Invoice Number: " + invoiceNumber, bodyFont));
            document.add(new Paragraph("Date: " + Instant.now().toString(), bodyFont));
            document.add(new Paragraph("Description: " + description, bodyFont));
            document.add(new Paragraph(" ", bodyFont));

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);

            addTableRow(table, "Milestone Gross Amount", "Rs. " + gross.toPlainString());
            addTableRow(table, "Platform Commission (10%)", "- Rs. " + commission.toPlainString());
            addTableRow(table, "GST on Platform Commission (18%)", "Rs. " + gst.toPlainString());
            addTableRow(table, "Net Freelancer Payout", "Rs. " + net.toPlainString());

            document.add(table);

            Paragraph footer = new Paragraph("\nThank you for collaborating through THEUNOiA Marketplace.", bodyFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF invoice", e);
            return new byte[0];
        }
    }

    private void addTableRow(PdfPTable table, String col1, String col2) {
        table.addCell(new PdfPCell(new Phrase(col1)));
        table.addCell(new PdfPCell(new Phrase(col2)));
    }
}
