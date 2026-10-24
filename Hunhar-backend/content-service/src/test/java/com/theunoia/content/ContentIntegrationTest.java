package com.theunoia.content;

import com.theunoia.content.domain.ContentEntities.BlogPost;
import com.theunoia.content.service.ContentService;
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
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
class ContentIntegrationTest {

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
    ContentService content;
    @Autowired
    JdbcTemplate jdbc;

    @Test
    void cmsBlogSeoAndRecommendations() {
        assertThat(content.page("home").getSeo().getMetaTitle()).contains("THEUNOiA");
        UUID tips = content.saveCategory(null, "Freelancing Tips", null).getId();
        UUID other = content.saveCategory(null, "Company News", null).getId();

        String body = "word ".repeat(450);
        BlogPost a = content.savePost(null, post("Pricing your first freelance project", tips, List.of("pricing", "beginner"), body));
        BlogPost b = content.savePost(null, post("Writing proposals that win bids", tips, List.of("proposals", "beginner"), body));
        content.savePost(null, post("THEUNOiA raises seed round", other, List.of("news"), "We are excited to announce funding."));

        assertThat(jdbc.queryForObject("SELECT reading_minutes FROM blog_posts WHERE id = ?", Integer.class, a.getId())).isEqualTo(3);
        assertThat(content.listPosts(null, null, "price freelance", 0, 10).totalItems()).isEqualTo(1);
        assertThat(content.listPosts("freelancing-tips", "beginner", null, 0, 10).totalItems()).isEqualTo(2);

        List<Map<String, Object>> next = content.recommendations(a.getSlug(), null, 2);
        assertThat(next.get(0).get("id")).isEqualTo(b.getId()); // shares tag + category
        assertThat(content.recommendations(a.getSlug(), List.of(b.getId()), 2)).noneMatch(m -> m.get("id").equals(b.getId()));

        assertThat(content.sitemap()).contains("/blog/" + a.getSlug()).contains("<loc>https://theunoia.com</loc>");
        content.contact("Ravi", "Ravi@Example.com", null, "Partnership", "Hello team");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM outbox_events WHERE event_type = 'contact.received'", Integer.class)).isEqualTo(1);
    }

    private static ContentService.PostCommand post(String title, UUID category, List<String> tags, String body) {
        return new ContentService.PostCommand(title, null, "excerpt", body, null, category, null, true, tags, null);
    }
}
