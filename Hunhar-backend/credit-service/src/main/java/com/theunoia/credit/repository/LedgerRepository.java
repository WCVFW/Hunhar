package com.theunoia.credit.repository;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Thin wrapper over the apply_credit_transaction() PL/pgSQL function and ledger queries. */
@Repository
@RequiredArgsConstructor
public class LedgerRepository {

    private final JdbcTemplate jdbc;

    public record Applied(UUID transactionId, int balance, boolean duplicate) {
    }

    public Applied apply(UUID userId, int amount, String type, String key, String reference, String description, UUID createdBy) {
        try {
            return jdbc.queryForObject("SELECT * FROM apply_credit_transaction(?, ?, ?, ?, ?, ?, ?)",
                    (rs, i) -> new Applied(rs.getObject("transaction_id", UUID.class), rs.getInt("new_balance"),
                            rs.getBoolean("duplicate")),
                    userId, amount, type, key, reference, description, createdBy);
        } catch (DataAccessException e) {
            String msg = String.valueOf(e.getMostSpecificCause().getMessage());
            if (msg.contains("INSUFFICIENT_CREDITS")) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_CREDITS",
                        "Not enough credits. Purchase more credits to continue bidding.");
            }
            throw e;
        }
    }

    public Map<String, Object> account(UUID userId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT user_id, balance, lifetime_earned, lifetime_spent, updated_at FROM credit_accounts WHERE user_id = ?", userId);
        if (rows.isEmpty()) {
            return Map.of("userId", userId, "balance", 0, "lifetimeEarned", 0, "lifetimeSpent", 0);
        }
        Map<String, Object> r = rows.get(0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", r.get("user_id"));
        out.put("balance", r.get("balance"));
        out.put("lifetimeEarned", r.get("lifetime_earned"));
        out.put("lifetimeSpent", r.get("lifetime_spent"));
        out.put("updatedAt", ((Timestamp) r.get("updated_at")).toInstant());
        return out;
    }

    public PageResponse<Map<String, Object>> transactions(UUID userId, String type, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (userId != null) {
            where.append(" AND user_id = ?");
            args.add(userId);
        }
        if (type != null && !type.isBlank()) {
            where.append(" AND type = ?");
            args.add(type);
        }
        int limit = Math.min(Math.max(size, 1), 100);
        int offset = Math.max(page, 0) * limit;
        Long total = jdbc.queryForObject("SELECT count(*) FROM credit_transactions" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(limit);
        pageArgs.add(offset);
        List<Map<String, Object>> items = jdbc.query("""
                SELECT id, user_id, type, amount, balance_after, reference, description, created_by, created_at
                FROM credit_transactions""" + where + " ORDER BY created_at DESC LIMIT ? OFFSET ?", (rs, i) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", rs.getObject("id", UUID.class));
            m.put("userId", rs.getObject("user_id", UUID.class));
            m.put("type", rs.getString("type"));
            m.put("amount", rs.getInt("amount"));
            m.put("balanceAfter", rs.getInt("balance_after"));
            m.put("reference", rs.getString("reference"));
            m.put("description", rs.getString("description"));
            m.put("createdBy", rs.getObject("created_by", UUID.class));
            m.put("createdAt", rs.getTimestamp("created_at").toInstant());
            return m;
        }, pageArgs.toArray());
        return PageResponse.of(items, page, limit, total == null ? 0 : total);
    }

    public Map<String, Object> summary() {
        return jdbc.queryForMap("""
                SELECT COALESCE(sum(balance), 0) AS outstanding_credits,
                       COALESCE(sum(lifetime_spent), 0) AS credits_spent,
                       count(*) AS accounts
                FROM credit_accounts""");
    }
}
