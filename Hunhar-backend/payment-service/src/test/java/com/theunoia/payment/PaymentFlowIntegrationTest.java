package com.theunoia.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.payment.client.ProjectClient;
import com.theunoia.payment.event.PaymentEventListener;
import com.theunoia.payment.service.CommissionCalculator;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
@AutoConfigureMockMvc
class PaymentFlowIntegrationTest {

    private static final EmbeddedPostgres PG;

    static {
        try {
            PG = EmbeddedPostgres.builder().start();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> PG.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
    }

    @AfterAll
    static void stop() throws IOException {
        PG.close();
    }

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper mapper;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    PaymentEventListener listener;
    @MockBean
    ProjectClient projectClient;

    final UUID client = UUID.randomUUID();
    final UUID freelancer = UUID.randomUUID();
    final UUID admin = UUID.randomUUID();
    final UUID projectId = UUID.randomUUID();

    @Test
    void commissionMath() {
        var b = CommissionCalculator.compute(new BigDecimal("10000"), new BigDecimal("0.10"), new BigDecimal("0.18"));
        assertThat(b.commission()).isEqualByComparingTo("1000.00");
        assertThat(b.gst()).isEqualByComparingTo("180.00");
        assertThat(b.net()).isEqualByComparingTo("8820.00");
    }

    @Test
    void escrowReleaseWithdrawalAndInvoices() throws Exception {
        UUID milestone = UUID.randomUUID();
        when(projectClient.milestone(any())).thenReturn(milestone(milestone, "10000.00"));

        // 1. client funds milestone -> 2. mock checkout capture -> escrow HELD
        String orderId = json(mvc.perform(as(post("/api/v1/payments/orders"), client, "CLIENT")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"milestoneId\":\"" + milestone + "\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("orderId").asText();
        mvc.perform(as(post("/api/v1/payments/mock/" + orderId + "/capture"), client, "CLIENT"))
                .andExpect(jsonPath("$.status").value("CAPTURED"));
        mvc.perform(as(post("/api/v1/payments/mock/" + orderId + "/capture"), client, "CLIENT"))
                .andExpect(jsonPath("$.status").value("CAPTURED")); // idempotent
        assertThat(jdbc.queryForObject("SELECT count(*) FROM escrow_holdings WHERE status = 'HELD'", Integer.class)).isEqualTo(1);
        mvc.perform(as(get("/api/v1/payments/wallet"), freelancer, "FREELANCER"))
                .andExpect(jsonPath("$.pendingPayments").value(10000.0));

        // double funding is impossible
        mvc.perform(as(post("/api/v1/payments/orders"), client, "CLIENT")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"milestoneId\":\"" + milestone + "\"}"))
                .andExpect(status().isConflict());

        // 3. client approves milestone -> release: 10000 - 10% commission - 18% GST on commission = 8820
        event("milestone.approved", Map.of("milestoneId", milestone.toString(), "paymentMode", "PLATFORM"));
        mvc.perform(as(get("/api/v1/payments/wallet"), freelancer, "FREELANCER"))
                .andExpect(jsonPath("$.availableBalance").value(8820.0))
                .andExpect(jsonPath("$.pendingPayments").value(0));

        // 4. freelancer adds a UPI payout account and withdraws; admin approves (mock payout)
        String accountId = json(mvc.perform(as(post("/api/v1/payments/payout-accounts"), freelancer, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"UPI\",\"accountHolderName\":\"Asha Rao\",\"upiId\":\"asha@okaxis\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
        mvc.perform(as(post("/api/v1/payments/withdrawals"), freelancer, "FREELANCER").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"payoutAccountId\":\"" + accountId + "\",\"amount\":9000}"))
                .andExpect(status().isUnprocessableEntity());
        String withdrawalId = json(mvc.perform(as(post("/api/v1/payments/withdrawals"), freelancer, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"payoutAccountId\":\"" + accountId + "\",\"amount\":5000}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
        mvc.perform(as(post("/api/v1/admin/payments/withdrawals/" + withdrawalId + "/approve"), admin, "ADMIN"))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        mvc.perform(as(get("/api/v1/payments/wallet"), freelancer, "FREELANCER"))
                .andExpect(jsonPath("$.availableBalance").value(3820.0))
                .andExpect(jsonPath("$.totalWithdrawn").value(5000.0));

        // 5. invoices: receipt (client), commission tax invoice + payout statement (freelancer), PDF download
        JsonNode inv = json(mvc.perform(as(get("/api/v1/payments/invoices"), freelancer, "FREELANCER"))
                .andReturn().getResponse().getContentAsString());
        assertThat(inv.path("totalItems").asInt()).isEqualTo(2);
        assertThat(inv.path("items").get(0).path("invoiceNumber").asText()).matches("TNU/\\d{4}-\\d{2}/\\d{6}");
        String invoiceId = inv.path("items").get(0).path("id").asText();
        byte[] pdf = mvc.perform(as(get("/api/v1/payments/invoices/" + invoiceId + "/pdf"), freelancer, "FREELANCER"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
        mvc.perform(as(get("/api/v1/payments/invoices/" + invoiceId + "/pdf"), client, "CLIENT")).andExpect(status().isForbidden());

        Map<String, Object> commission = jdbc.queryForMap("""
                SELECT c.* FROM commissions c JOIN escrow_holdings e ON e.id = c.escrow_id WHERE e.milestone_id = ?""", milestone);
        assertThat((BigDecimal) commission.get("commission_amount")).isEqualByComparingTo("1000.00");
        assertThat((BigDecimal) commission.get("gst_amount")).isEqualByComparingTo("180.00");
        mvc.perform(as(get("/api/v1/admin/payments/summary"), admin, "ADMIN")).andExpect(status().isOk());
        mvc.perform(as(get("/api/v1/admin/payments/summary"), freelancer, "FREELANCER")).andExpect(status().isForbidden());
    }

    @Test
    void disputeSplitSettlement() throws Exception {
        UUID milestone = UUID.randomUUID();
        when(projectClient.milestone(any())).thenReturn(milestone(milestone, "20000.00"));
        String orderId = json(mvc.perform(as(post("/api/v1/payments/orders"), client, "CLIENT")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"milestoneId\":\"" + milestone + "\"}"))
                .andReturn().getResponse().getContentAsString()).path("orderId").asText();
        mvc.perform(as(post("/api/v1/payments/mock/" + orderId + "/capture"), client, "CLIENT"));

        event("dispute.resolved", Map.of("milestoneId", milestone.toString(), "resolution", "SPLIT",
                "freelancerSharePercent", 25, "disputeId", UUID.randomUUID().toString()));

        Map<String, Object> escrow = jdbc.queryForMap("SELECT * FROM escrow_holdings WHERE milestone_id = ?", milestone);
        assertThat(escrow.get("status")).isEqualTo("SPLIT");
        assertThat((BigDecimal) escrow.get("released_amount")).isEqualByComparingTo("5000.00");
        assertThat((BigDecimal) escrow.get("refunded_amount")).isEqualByComparingTo("15000.00");
        assertThat(jdbc.queryForObject("SELECT status FROM payment_orders WHERE id = ?::uuid", String.class, orderId))
                .isEqualTo("PARTIALLY_REFUNDED");
    }

    private Map<String, Object> milestone(UUID milestone, String amount) {
        Map<String, Object> m = new HashMap<>();
        m.put("milestoneId", milestone.toString());
        m.put("projectId", projectId.toString());
        m.put("projectTitle", "Payments API");
        m.put("title", "Milestone 1");
        m.put("clientId", client.toString());
        m.put("freelancerId", freelancer.toString());
        m.put("amount", amount);
        m.put("status", "PENDING");
        m.put("projectStatus", "IN_PROGRESS");
        m.put("paymentMode", "PLATFORM");
        return m;
    }

    private void event(String type, Map<String, Object> data) {
        listener.on(new EventEnvelope(UUID.randomUUID(), type, Instant.now(), "test", data));
    }

    private JsonNode json(String s) throws IOException {
        return mapper.readTree(s);
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder b, UUID user, String role) {
        return b.header("X-Internal-Token", "dev-internal-token-change-me")
                .header("X-User-Id", user.toString()).header("X-User-Role", role).header("X-User-Status", "ACTIVE");
    }
}
