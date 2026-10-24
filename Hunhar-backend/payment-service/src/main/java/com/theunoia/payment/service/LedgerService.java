package com.theunoia.payment.service;

import com.theunoia.common.web.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Writes the append-only money journal (Transaction Logs / Transaction History). */
@Service
@RequiredArgsConstructor
public class LedgerService {

    public enum Account { WALLET, ESCROW, PLATFORM_REVENUE, TAX_PAYABLE, PAYOUT_PENDING, EXTERNAL }

    private final JdbcTemplate jdbc;

    @Transactional(propagation = Propagation.MANDATORY)
    public void credit(UUID userId, Account account, String type, BigDecimal amount, BigDecimal balanceAfter,
                       String refType, UUID refId, String description) {
        write(userId, account, type, "CREDIT", amount, balanceAfter, refType, refId, description);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void debit(UUID userId, Account account, String type, BigDecimal amount, BigDecimal balanceAfter,
                      String refType, UUID refId, String description) {
        write(userId, account, type, "DEBIT", amount, balanceAfter, refType, refId, description);
    }

    private void write(UUID userId, Account account, String type, String direction, BigDecimal amount, BigDecimal balanceAfter,
                       String refType, UUID refId, String description) {
        if (amount.signum() <= 0) return;
        jdbc.update("""
                INSERT INTO ledger_entries (user_id, account, entry_type, direction, amount, balance_after, reference_type,
                                            reference_id, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                userId, account.name(), type, direction, amount, balanceAfter, refType, refId, description);
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> history(UUID userId, int page, int size) {
        int limit = Math.min(Math.max(size, 1), 100);
        int offset = Math.max(page, 0) * limit;
        String where = userId == null ? "" : " WHERE user_id = ?";
        Object[] countArgs = userId == null ? new Object[0] : new Object[]{userId};
        Long total = jdbc.queryForObject("SELECT count(*) FROM ledger_entries" + where, Long.class, countArgs);
        Object[] args = userId == null ? new Object[]{limit, offset} : new Object[]{userId, limit, offset};
        List<Map<String, Object>> items = jdbc.query("SELECT * FROM ledger_entries" + where
                + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", (rs, i) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", rs.getLong("id"));
            m.put("userId", rs.getObject("user_id", UUID.class));
            m.put("account", rs.getString("account"));
            m.put("type", rs.getString("entry_type"));
            m.put("direction", rs.getString("direction"));
            m.put("amount", rs.getBigDecimal("amount"));
            m.put("balanceAfter", rs.getBigDecimal("balance_after"));
            m.put("referenceType", rs.getString("reference_type"));
            m.put("referenceId", rs.getObject("reference_id", UUID.class));
            m.put("description", rs.getString("description"));
            m.put("createdAt", rs.getTimestamp("created_at").toInstant());
            return m;
        }, args);
        return PageResponse.of(items, page, limit, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> monthlyRevenue(int months) {
        return jdbc.queryForList("""
                SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
                       sum(commission_amount) AS commission, sum(gst_amount) AS gst, sum(gross_amount) AS gross_volume,
                       count(*) AS releases
                FROM commissions
                WHERE created_at >= date_trunc('month', now()) - make_interval(months => ?)
                GROUP BY 1 ORDER BY 1""", months);
    }
}
