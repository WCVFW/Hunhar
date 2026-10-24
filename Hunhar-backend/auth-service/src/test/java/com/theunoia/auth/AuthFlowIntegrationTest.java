package com.theunoia.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end flow against a real PostgreSQL (embedded): Flyway migrations, JPA mappings,
 * outbox writes and the registration -> verification -> approval -> login lifecycle.
 */
@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    private static final String INTERNAL = "dev-internal-token-change-me";
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
    JdbcTemplate jdbc;
    @Autowired
    ObjectMapper mapper;

    @Test
    void freelancerLifecycle() throws Exception {
        String body = """
                {"fullName":"Asha Rao","email":"Asha@Example.com","mobile":"9876543210","password":"Secret123",
                 "skills":["Java","Spring Boot"],"portfolioLinks":["https://github.com/asha"]}""";
        mvc.perform(internal(post("/api/v1/auth/register/freelancer")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_VERIFICATION"));

        // duplicate email is rejected (case-insensitive)
        mvc.perform(internal(post("/api/v1/auth/register/freelancer")).contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("9876543210", "9876543211").replace("Asha@", "asha@")))
                .andExpect(status().isConflict());

        // requests that bypass the gateway are refused
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());

        // the verification link is delivered via the outbox event
        String payload = jdbc.queryForObject("SELECT payload::text FROM outbox_events WHERE event_type = "
                + "'auth.email_verification_requested' ORDER BY id DESC LIMIT 1", String.class);
        String url = mapper.readTree(payload).path("data").path("verificationUrl").asText();
        String token = url.substring(url.indexOf("token=") + 6);
        mvc.perform(internal(post("/api/v1/auth/verify-email")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(true));

        String login = mvc.perform(internal(post("/api/v1/auth/login")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"asha@example.com\",\"password\":\"Secret123\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode tokens = mapper.readTree(login);
        String userId = tokens.path("user").path("id").asText();
        assertThat(tokens.path("accessToken").asText()).isNotBlank();

        // Aadhaar KYC with the mock DigiLocker provider
        mvc.perform(asUser(post("/api/v1/auth/kyc/aadhaar/initiate"), userId, "FREELANCER")).andExpect(status().isOk());
        mvc.perform(asUser(get("/api/v1/auth/kyc/aadhaar/status"), userId, "FREELANCER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.aadhaarLast4").value("1234"));
        mvc.perform(asUser(get("/api/v1/auth/me"), userId, "FREELANCER"))
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"));

        // non-admins cannot approve; admin can
        mvc.perform(asUser(post("/api/v1/admin/users/" + userId + "/approve"), userId, "FREELANCER"))
                .andExpect(status().isForbidden());
        String adminId = jdbc.queryForObject("SELECT id::text FROM users WHERE role = 'ADMIN'", String.class);
        mvc.perform(asUser(post("/api/v1/admin/users/" + userId + "/approve"), adminId, "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // refresh rotation + reuse detection
        String refresh = tokens.path("refreshToken").asText();
        String rotated = mvc.perform(internal(post("/api/v1/auth/refresh")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.status").value("ACTIVE"))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(internal(post("/api/v1/auth/refresh")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isUnauthorized());
        String newRefresh = mapper.readTree(rotated).path("refreshToken").asText();
        mvc.perform(internal(post("/api/v1/auth/refresh")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefresh + "\"}"))
                .andExpect(status().isUnauthorized()); // whole family revoked after reuse

        Integer events = jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE event_type IN "
                + "('user.registered','user.kyc_verified','user.approved','user.awaiting_approval')", Integer.class);
        assertThat(events).isEqualTo(4);
    }

    private MockHttpServletRequestBuilder internal(MockHttpServletRequestBuilder b) {
        return b.header("X-Internal-Token", INTERNAL);
    }

    private MockHttpServletRequestBuilder asUser(MockHttpServletRequestBuilder b, String id, String role) {
        return internal(b).header("X-User-Id", id).header("X-User-Role", role).header("X-User-Status", "ACTIVE");
    }
}
