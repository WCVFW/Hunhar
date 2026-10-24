package com.theunoia.project;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.event.EventEnvelope;
import com.theunoia.project.client.CreditClient;
import com.theunoia.project.event.ProjectEventListener;
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
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Post project -> full-text discovery -> bid (credits) -> award -> fund -> deliver -> approve -> pay -> complete -> review. */
@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
@AutoConfigureMockMvc
class ProjectLifecycleIntegrationTest {

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
    ProjectEventListener listener;
    @MockBean
    CreditClient credits;

    final UUID client = UUID.randomUUID();
    final UUID freelancer = UUID.randomUUID();
    final UUID rival = UUID.randomUUID();

    @Test
    void fullProjectLifecycle() throws Exception {
        String project = """
                {"title":"Build a Spring Boot payments API","description":"We need an experienced engineer to build a secure payments backend with Razorpay integration.",
                 "budgetType":"FIXED","budgetMin":20000,"budgetMax":40000,"skills":["Java","Spring Boot"],"publish":true}""";
        JsonNode created = json(mvc.perform(as(post("/api/v1/projects"), client, "CLIENT").contentType(MediaType.APPLICATION_JSON).content(project))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.creditCost").value(4))
                .andReturn().getResponse().getContentAsString());
        String projectId = created.path("id").asText();

        // Full-text search (stemming: "payment" matches "payments")
        mvc.perform(internal(get("/api/v1/projects")).param("q", "payment razorpay").param("sort", "relevance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.items[0].skills.length()").value(2));

        String bid = """
                {"amount":30000,"deliveryDays":20,"proposal":"I have built several Razorpay integrations with Spring Boot and can deliver this quickly."}""";
        String bidId = json(mvc.perform(as(post("/api/v1/projects/" + projectId + "/bids"), freelancer, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON).content(bid))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("id").asText();
        verify(credits).debit(eq(freelancer), eq(4), eq("bid:" + projectId + ":" + freelancer), anyString(), anyString());
        mvc.perform(as(post("/api/v1/projects/" + projectId + "/bids"), rival, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON).content(bid.replace("30000", "25000")))
                .andExpect(status().isCreated());
        mvc.perform(as(post("/api/v1/projects/" + projectId + "/bids"), freelancer, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON).content(bid))
                .andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT bid_count FROM projects WHERE id = ?::uuid", Integer.class, projectId)).isEqualTo(2);

        // client compares bids, then awards
        mvc.perform(as(get("/api/v1/projects/" + projectId + "/bids"), client, "CLIENT").param("sort", "amount"))
                .andExpect(jsonPath("$.totalBids").value(2))
                .andExpect(jsonPath("$.lowestAmount").value(25000.0));
        mvc.perform(as(post("/api/v1/bids/" + bidId + "/award"), client, "CLIENT"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACCEPTED"));

        JsonNode ws = json(mvc.perform(as(get("/api/v1/projects/" + projectId + "/workspace"), freelancer, "FREELANCER"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        String milestoneId = ws.path("milestones").get(0).path("id").asText();
        assertThat(ws.path("project").path("status").asText()).isEqualTo("IN_PROGRESS");

        // cannot submit before escrow is funded (PLATFORM payments)
        mvc.perform(as(post("/api/v1/milestones/" + milestoneId + "/submit"), freelancer, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"done\"}"))
                .andExpect(status().isUnprocessableEntity());
        event("payment.captured", Map.of("purpose", "PROJECT_PAYMENT", "milestoneId", milestoneId));
        mvc.perform(as(post("/api/v1/milestones/" + milestoneId + "/submit"), freelancer, "FREELANCER")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"note\":\"All endpoints delivered\"}"))
                .andExpect(jsonPath("$.status").value("SUBMITTED"));
        mvc.perform(as(post("/api/v1/milestones/" + milestoneId + "/approve"), client, "CLIENT"))
                .andExpect(jsonPath("$.status").value("APPROVED"));
        event("escrow.released", Map.of("milestoneId", milestoneId));

        mvc.perform(as(post("/api/v1/projects/" + projectId + "/complete"), client, "CLIENT"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));
        mvc.perform(as(post("/api/v1/projects/" + projectId + "/reviews"), client, "CLIENT")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5,\"comment\":\"Excellent\"}"))
                .andExpect(status().isCreated());

        for (String type : new String[]{"project.published", "bid.submitted", "project.awarded", "milestone.approved",
                "project.completed", "review.created"}) {
            assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE event_type = ?", Integer.class, type))
                    .as(type).isGreaterThanOrEqualTo(1);
        }
        verify(credits, org.mockito.Mockito.never()).refund(eq(freelancer), anyInt(), anyString(), anyString(), anyString());
    }

    private void event(String type, Map<String, Object> data) {
        listener.on(new EventEnvelope(UUID.randomUUID(), type, Instant.now(), "test", data));
    }

    private JsonNode json(String s) throws IOException {
        return mapper.readTree(s);
    }

    private MockHttpServletRequestBuilder internal(MockHttpServletRequestBuilder b) {
        return b.header("X-Internal-Token", "dev-internal-token-change-me");
    }

    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder b, UUID user, String role) {
        return internal(b).header("X-User-Id", user.toString()).header("X-User-Role", role).header("X-User-Status", "ACTIVE");
    }
}
