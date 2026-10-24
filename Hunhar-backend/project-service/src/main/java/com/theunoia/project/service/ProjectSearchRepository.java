package com.theunoia.project.service;

import com.theunoia.common.web.PageResponse;
import com.theunoia.project.dto.ProjectDtos.ProjectSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Project discovery (browse / filter / search) on PostgreSQL full-text search:
 * websearch_to_tsquery understands "quoted phrases", OR and -exclusions; results are
 * ranked by ts_rank over the weighted (title A, description B) generated tsvector.
 */
@Repository
@RequiredArgsConstructor
public class ProjectSearchRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public record Criteria(String q, UUID categoryId, String skill, BigDecimal minBudget, BigDecimal maxBudget,
                           String budgetType, String sort, int page, int size) {
    }

    public PageResponse<ProjectSummary> search(Criteria c) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE p.status = 'OPEN'");
        boolean hasQuery = c.q() != null && !c.q().isBlank();
        if (hasQuery) {
            where.append(" AND p.search_vector @@ websearch_to_tsquery('english', :q)");
            params.addValue("q", c.q().trim());
        }
        if (c.categoryId() != null) {
            where.append(" AND p.category_id = :categoryId");
            params.addValue("categoryId", c.categoryId());
        }
        if (c.skill() != null && !c.skill().isBlank()) {
            where.append(" AND EXISTS (SELECT 1 FROM project_skills s WHERE s.project_id = p.id AND lower(s.skill) = lower(:skill))");
            params.addValue("skill", c.skill().trim());
        }
        if (c.minBudget() != null) {
            where.append(" AND p.budget_max >= :minBudget");
            params.addValue("minBudget", c.minBudget());
        }
        if (c.maxBudget() != null) {
            where.append(" AND p.budget_min <= :maxBudget");
            params.addValue("maxBudget", c.maxBudget());
        }
        if (c.budgetType() != null && !c.budgetType().isBlank()) {
            where.append(" AND p.budget_type = :budgetType");
            params.addValue("budgetType", c.budgetType());
        }

        String order = switch (c.sort() == null ? "" : c.sort()) {
            case "budget_high" -> " ORDER BY p.budget_max DESC, p.published_at DESC";
            case "budget_low" -> " ORDER BY p.budget_min ASC, p.published_at DESC";
            case "fewest_bids" -> " ORDER BY p.bid_count ASC, p.published_at DESC";
            case "relevance" -> hasQuery
                    ? " ORDER BY ts_rank(p.search_vector, websearch_to_tsquery('english', :q)) DESC, p.published_at DESC"
                    : " ORDER BY p.published_at DESC";
            default -> " ORDER BY p.published_at DESC";
        };

        int size = Math.min(Math.max(c.size(), 1), 100);
        int page = Math.max(c.page(), 0);
        params.addValue("limit", size).addValue("offset", page * size);

        Long total = jdbc.queryForObject("SELECT count(*) FROM projects p" + where, params, Long.class);
        List<ProjectSummary> items = jdbc.query("""
                SELECT p.id, p.client_id, p.title, left(p.description, 280) AS excerpt, p.category_id, c.name AS category_name,
                       p.budget_type, p.budget_min, p.budget_max, p.currency, p.deadline, p.status, p.payment_mode,
                       p.credit_cost, p.bid_count, p.published_at,
                       (SELECT string_agg(s.skill, ',' ORDER BY s.skill) FROM project_skills s WHERE s.project_id = p.id) AS skills
                FROM projects p LEFT JOIN categories c ON c.id = p.category_id""" + where + order + " LIMIT :limit OFFSET :offset",
                params, (rs, i) -> {
                    String skills = rs.getString("skills");
                    Timestamp published = rs.getTimestamp("published_at");
                    java.sql.Date deadline = rs.getDate("deadline");
                    return new ProjectSummary(rs.getObject("id", UUID.class), rs.getObject("client_id", UUID.class),
                            rs.getString("title"), rs.getString("excerpt"), rs.getObject("category_id", UUID.class),
                            rs.getString("category_name"), rs.getString("budget_type"), rs.getBigDecimal("budget_min"),
                            rs.getBigDecimal("budget_max"), rs.getString("currency"),
                            deadline == null ? null : deadline.toLocalDate(), rs.getString("status"),
                            rs.getString("payment_mode"), rs.getInt("credit_cost"), rs.getInt("bid_count"),
                            skills == null ? List.of() : Arrays.asList(skills.split(",")),
                            published == null ? null : published.toInstant());
                });
        return PageResponse.of(items, page, size, total == null ? 0 : total);
    }
}
