package com.theunoia.user.repository;

import com.theunoia.user.dto.UserDtos.FreelancerCard;
import com.theunoia.user.dto.UserDtos.StatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Ranking counters are updated with single atomic UPDATE statements (no read-modify-write
 * races between concurrent event consumers); the PL/pgSQL trigger recomputes the score.
 */
@Repository
@RequiredArgsConstructor
public class StatsRepository {

    private final JdbcTemplate jdbc;

    public void ensure(UUID userId) {
        jdbc.update("INSERT INTO freelancer_stats (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING", userId);
    }

    public void projectCompleted(UUID userId) {
        jdbc.update("UPDATE freelancer_stats SET completed_projects = completed_projects + 1 WHERE user_id = ?", userId);
    }

    public void projectCancelled(UUID userId) {
        jdbc.update("UPDATE freelancer_stats SET cancelled_projects = cancelled_projects + 1 WHERE user_id = ?", userId);
    }

    public void reviewReceived(UUID userId, int rating) {
        jdbc.update("UPDATE freelancer_stats SET total_reviews = total_reviews + 1, rating_sum = rating_sum + ? WHERE user_id = ?",
                rating, userId);
    }

    public void revenueEarned(UUID userId, BigDecimal amount) {
        jdbc.update("UPDATE freelancer_stats SET revenue = revenue + ? WHERE user_id = ?", amount, userId);
    }

    public void responseStats(UUID userId, int received, int responded) {
        jdbc.update("UPDATE freelancer_stats SET conversations_received = ?, conversations_responded = ? WHERE user_id = ?",
                received, Math.min(responded, received), userId);
    }

    public Optional<StatsResponse> find(UUID userId) {
        List<StatsResponse> rows = jdbc.query("""
                SELECT s.*, r.rank FROM freelancer_stats s
                JOIN (SELECT user_id, RANK() OVER (ORDER BY score DESC) AS rank FROM freelancer_stats) r USING (user_id)
                WHERE s.user_id = ?""", (rs, i) -> new StatsResponse(
                rs.getInt("completed_projects"), rs.getInt("cancelled_projects"), rs.getInt("total_reviews"),
                rs.getBigDecimal("avg_rating"), rs.getBigDecimal("revenue"), rs.getBigDecimal("success_rate"),
                rs.getBigDecimal("response_rate"), rs.getBigDecimal("score"), rs.getLong("rank")), userId);
        return rows.stream().findFirst();
    }

    /** Leaderboard: active freelancers ranked by score with a dense rank window function. */
    public List<FreelancerCard> leaderboard(int limit) {
        return jdbc.query(CARD_SELECT + " WHERE p.verification_status = 'ACTIVE' ORDER BY s.score DESC, s.completed_projects DESC LIMIT ?",
                CARD_MAPPER, limit);
    }

    public List<FreelancerCard> search(String skill, String q, BigDecimal maxRate, int limit, int offset) {
        StringBuilder sql = new StringBuilder(CARD_SELECT).append(" WHERE p.verification_status = 'ACTIVE'");
        List<Object> args = new ArrayList<>();
        appendFilters(sql, args, skill, q, maxRate);
        sql.append(" ORDER BY s.score DESC, p.created_at DESC LIMIT ? OFFSET ?");
        args.add(limit);
        args.add(offset);
        return jdbc.query(sql.toString(), CARD_MAPPER, args.toArray());
    }

    public long count(String skill, String q, BigDecimal maxRate) {
        StringBuilder sql = new StringBuilder("SELECT count(*) FROM freelancer_profiles p WHERE p.verification_status = 'ACTIVE'");
        List<Object> args = new ArrayList<>();
        appendFilters(sql, args, skill, q, maxRate);
        Long n = jdbc.queryForObject(sql.toString(), Long.class, args.toArray());
        return n == null ? 0 : n;
    }

    /** Active freelancers having at least one of the given skills (used for "new project match" alerts). */
    public List<UUID> matchingFreelancers(List<String> skills, int limit) {
        if (skills.isEmpty()) return List.of();
        String[] lowered = skills.stream().map(String::toLowerCase).toArray(String[]::new);
        return jdbc.query("""
                SELECT p.user_id FROM freelancer_profiles p
                JOIN freelancer_skills fs ON fs.user_id = p.user_id
                LEFT JOIN freelancer_stats s ON s.user_id = p.user_id
                WHERE p.verification_status = 'ACTIVE' AND p.availability <> 'NOT_AVAILABLE'
                  AND lower(fs.skill) = ANY (?)
                GROUP BY p.user_id, s.score
                ORDER BY count(*) DESC, s.score DESC NULLS LAST
                LIMIT ?""", (rs, i) -> rs.getObject(1, UUID.class), lowered, limit);
    }

    private static void appendFilters(StringBuilder sql, List<Object> args, String skill, String q, BigDecimal maxRate) {
        if (skill != null && !skill.isBlank()) {
            sql.append(" AND EXISTS (SELECT 1 FROM freelancer_skills fs WHERE fs.user_id = p.user_id AND lower(fs.skill) = lower(?))");
            args.add(skill.trim());
        }
        if (q != null && !q.isBlank()) {
            sql.append(" AND (p.full_name ILIKE ? OR p.headline ILIKE ?)");
            String like = "%" + q.trim().replace("%", "\\%") + "%";
            args.add(like);
            args.add(like);
        }
        if (maxRate != null) {
            sql.append(" AND p.hourly_rate <= ?");
            args.add(maxRate);
        }
    }

    private static final String CARD_SELECT = """
            SELECT p.user_id, p.full_name, p.headline, p.avatar_url, p.location, p.hourly_rate,
                   COALESCE(s.avg_rating, 0) AS avg_rating, COALESCE(s.total_reviews, 0) AS total_reviews,
                   COALESCE(s.completed_projects, 0) AS completed_projects, COALESCE(s.score, 0) AS score,
                   (SELECT string_agg(skill, ',' ORDER BY skill) FROM freelancer_skills k WHERE k.user_id = p.user_id) AS skills
            FROM freelancer_profiles p
            LEFT JOIN freelancer_stats s ON s.user_id = p.user_id""";

    private static final RowMapper<FreelancerCard> CARD_MAPPER = StatsRepository::mapCard;

    private static FreelancerCard mapCard(ResultSet rs, int i) throws SQLException {
        String skills = rs.getString("skills");
        return new FreelancerCard(rs.getObject("user_id", UUID.class), rs.getString("full_name"), rs.getString("headline"),
                rs.getString("avatar_url"), rs.getString("location"), rs.getBigDecimal("hourly_rate"),
                rs.getBigDecimal("avg_rating"), rs.getInt("total_reviews"), rs.getInt("completed_projects"),
                rs.getBigDecimal("score"), skills == null ? List.of() : Arrays.asList(skills.split(",")));
    }
}
