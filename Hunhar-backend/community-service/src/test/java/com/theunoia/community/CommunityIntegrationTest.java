package com.theunoia.community;

import com.theunoia.common.security.AuthUser;
import com.theunoia.community.domain.CommunityEntities.ForumThread;
import com.theunoia.community.domain.CommunityEntities.Reply;
import com.theunoia.community.service.CommunityService;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
class CommunityIntegrationTest {

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
    CommunityService community;
    @Autowired
    JdbcTemplate jdbc;

    @Test
    void questionAnswerVotingAndModeration() {
        AuthUser asker = user("FREELANCER");
        AuthUser helper = user("FREELANCER");
        AuthUser admin = user("ADMIN");
        UUID category = community.categories().get(1).getId();

        ForumThread q = community.create(asker, new CommunityService.ThreadCommand(category, "QUESTION",
                "How do I price fixed projects?", "I am new to freelancing and wonder how to estimate fixed price work.",
                List.of("Pricing", "beginner")));
        Reply answer = community.reply(helper, q.getId(), "Estimate hours, add a 20% buffer and price per milestone.");

        community.vote(helper, "THREAD", q.getId(), 1);
        community.vote(asker, "REPLY", answer.getId(), 1);
        community.vote(admin, "REPLY", answer.getId(), 1);
        community.vote(admin, "REPLY", answer.getId(), -1);  // changes vote: +1 -> -1
        assertThat(score("replies", answer.getId())).isEqualTo(0);
        assertThat(score("threads", q.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT reply_count FROM threads WHERE id = ?", Integer.class, q.getId())).isEqualTo(1);

        community.acceptAnswer(asker, q.getId(), answer.getId());
        assertThat(community.feed(null, "QUESTION", "pricing", "price project", "latest", 0, 10).totalItems()).isEqualTo(1);
        assertThat(community.feed(null, null, null, null, "unanswered", 0, 10).totalItems()).isZero();

        var report = community.report(helper, "THREAD", q.getId(), "SPAM", "test");
        community.resolveReport(admin, report.getId(), "HIDE_CONTENT");
        assertThat(community.feed(null, null, null, null, "latest", 0, 10).totalItems()).isZero();

        community.follow(helper, asker.id(), true);
        community.follow(helper, asker.id(), true); // idempotent
        assertThat(community.network(asker.id()).get("followerCount")).isEqualTo(1L);
    }

    private int score(String table, UUID id) {
        return jdbc.queryForObject("SELECT vote_score FROM " + table + " WHERE id = ?", Integer.class, id);
    }

    private static AuthUser user(String role) {
        return new AuthUser(UUID.randomUUID(), role, "ACTIVE", null);
    }
}
