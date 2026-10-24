package com.theunoia.credit;

import com.theunoia.common.event.EventEnvelope;
import com.theunoia.common.exception.ApiException;
import com.theunoia.credit.event.CreditEventListener;
import com.theunoia.credit.service.CreditService;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000"
})
class CreditLedgerIntegrationTest {

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
    CreditService credits;
    @Autowired
    CreditEventListener listener;
    @Autowired
    JdbcTemplate jdbc;

    @Test
    void starterGrantIdempotentDebitsAndNoOverdraftUnderConcurrency() throws Exception {
        UUID user = UUID.randomUUID();
        EventEnvelope registered = new EventEnvelope(UUID.randomUUID(), "user.registered", Instant.now(), "test",
                Map.of("userId", user.toString(), "role", "FREELANCER"));
        listener.on(registered);
        listener.on(registered); // redelivery is ignored
        assertThat(balance(user)).isEqualTo(20);

        // same idempotency key twice -> charged once
        credits.debitForBid(user, 4, "bid:p1:" + user, "PROJECT:p1", "bid");
        assertThat(credits.debitForBid(user, 4, "bid:p1:" + user, "PROJECT:p1", "bid").duplicate()).isTrue();
        assertThat(balance(user)).isEqualTo(16);

        // 10 concurrent debits of 4 credits against a balance of 16: exactly 4 succeed, balance never negative
        ExecutorService pool = Executors.newFixedThreadPool(10);
        AtomicInteger insufficient = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            int n = i;
            futures.add(pool.submit(() -> {
                try {
                    credits.debitForBid(user, 4, "bid:concurrent-" + n, "PROJECT:x", "bid");
                } catch (ApiException e) {
                    insufficient.incrementAndGet();
                }
            }));
        }
        for (Future<?> f : futures) f.get();
        pool.shutdown();
        assertThat(balance(user)).isZero();
        assertThat(insufficient.get()).isEqualTo(6);

        assertThatThrownBy(() -> credits.debitForBid(user, 1, "bid:none", "PROJECT:y", "bid"))
                .isInstanceOf(ApiException.class).hasMessageContaining("Not enough credits");

        // ledger is append-only (PL/pgSQL trigger)
        assertThatThrownBy(() -> jdbc.update("UPDATE credit_transactions SET amount = 100 WHERE user_id = ?", user))
                .rootCause().hasMessageContaining("append-only");

        Integer sum = jdbc.queryForObject("SELECT sum(amount) FROM credit_transactions WHERE user_id = ?", Integer.class, user);
        assertThat(sum).isEqualTo(balance(user));
    }

    private int balance(UUID user) {
        return jdbc.queryForObject("SELECT balance FROM credit_accounts WHERE user_id = ?", Integer.class, user);
    }
}
