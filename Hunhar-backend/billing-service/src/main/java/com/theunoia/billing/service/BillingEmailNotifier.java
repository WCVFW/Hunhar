package com.theunoia.billing.service;

import com.theunoia.billing.domain.Invoice;
import com.theunoia.common.internal.InternalClient;
import com.theunoia.common.internal.UserDirectoryClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Emails an invoice (PDF attached) to the account's email address after a successful payment.
 * Mail goes out only after the payment transaction commits, in the background, so a slow or failing
 * mail server never delays or undoes a payment. Sending is done by identity-service (it owns SMTP).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BillingEmailNotifier {

    private final InternalClient internalClient;
    private final UserDirectoryClient userDirectory;

    /**
     * @param userId      who receives the email (their login email)
     * @param invoice     the saved invoice; its PDF is attached
     * @param subject     email subject
     * @param messageText one plain-text sentence describing the payment (HTML-escaped here)
     * @param amount      amount shown in the summary box
     */
    public void sendInvoice(UUID userId, Invoice invoice, String subject, String messageText, BigDecimal amount) {
        // Copy what the background task needs now (entities must not be touched after the transaction)
        String number = invoice.getInvoiceNumber();
        byte[] pdf = invoice.getPdfContent();
        Runnable task = () -> CompletableFuture.runAsync(() -> deliver(userId, number, pdf, subject, messageText, amount));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    task.run();
                }
            });
        } else {
            task.run();
        }
    }

    private void deliver(UUID userId, String number, byte[] pdf, String subject, String messageText, BigDecimal amount) {
        try {
            var user = userDirectory.lookup(List.of(userId)).get(userId);
            if (user == null || user.email() == null || user.email().isBlank()) {
                log.warn("Invoice {} not emailed: no email address for user {}", number, userId);
                return;
            }
            String name = user.fullName() != null ? user.fullName() : "there";
            String amountText = InvoiceService.rupees(amount).replace("Rs. ", "₹");
            String html = """
                    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F1B3D">
                      <div style="font-size:24px;font-weight:bold;color:#C06B3E;margin-bottom:4px">hunhar</div>
                      <div style="font-size:13px;color:#64748B;margin-bottom:20px">Payment confirmation</div>
                      <p style="font-size:15px;margin:0 0 12px">Hi %s,</p>
                      <p style="font-size:14px;line-height:1.6;margin:0 0 18px">%s</p>
                      <table style="width:100%%;font-size:14px;border-collapse:collapse;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px">
                        <tr><td style="padding:10px 14px;color:#64748B">Invoice number</td><td style="padding:10px 14px;text-align:right;font-weight:bold">%s</td></tr>
                        <tr><td style="padding:10px 14px;color:#64748B">Amount</td><td style="padding:10px 14px;text-align:right;font-weight:bold">%s</td></tr>
                        <tr><td style="padding:10px 14px;color:#64748B">Status</td><td style="padding:10px 14px;text-align:right;font-weight:bold;color:#16A34A">PAID</td></tr>
                      </table>
                      <p style="font-size:13px;color:#64748B;margin:18px 0 0">Your invoice is attached as a PDF. You can also download it any time from your Hunhar dashboard (Wallet / Payments &rarr; Invoices).</p>
                      <p style="font-size:12px;color:#94A3B8;margin:24px 0 0">This is an automated email from hunhar.in. If you did not make this payment, contact support@hunhar.in.</p>
                    </div>
                    """.formatted(HtmlUtils.htmlEscape(name), HtmlUtils.htmlEscape(messageText), number, amountText);
            String text = "Hi " + name + ",\n\n" + messageText + "\n\nInvoice number: " + number + "\nAmount: " + amountText
                    + "\nStatus: PAID\n\nYour invoice is attached as a PDF.\n\nHunhar";

            Map<String, Object> body = new HashMap<>();
            body.put("to", user.email());
            body.put("subject", subject);
            body.put("text", text);
            body.put("html", html);
            if (pdf != null && pdf.length > 0) {
                body.put("attachmentName", number + ".pdf");
                body.put("attachmentContentType", "application/pdf");
                body.put("attachmentBase64", Base64.getEncoder().encodeToString(pdf));
            }
            internalClient.post(internalClient.identity() + "/internal/email/send", body,
                    new ParameterizedTypeReference<Map<String, Object>>() {});
            log.info("Invoice {} emailed to {}", number, mask(user.email()));
        } catch (Exception e) {
            log.warn("Failed to email invoice {} to user {}: {}", number, userId, e.getMessage());
        }
    }

    private static String mask(String email) {
        int at = email.indexOf('@');
        return at > 2 ? email.substring(0, 2) + "***" + email.substring(at) : "***";
    }
}
