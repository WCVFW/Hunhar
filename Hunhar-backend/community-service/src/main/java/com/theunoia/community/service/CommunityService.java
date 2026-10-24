package com.theunoia.community.service;

import com.theunoia.common.event.EventPublisher;
import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.web.PageResponse;
import com.theunoia.common.web.Pagination;
import com.theunoia.community.domain.CommunityEntities.ContentReport;
import com.theunoia.community.domain.CommunityEntities.ForumCategory;
import com.theunoia.community.domain.CommunityEntities.ForumThread;
import com.theunoia.community.domain.CommunityEntities.Reply;
import com.theunoia.community.repository.CommunityRepositories.CategoryRepository;
import com.theunoia.community.repository.CommunityRepositories.ReplyRepository;
import com.theunoia.community.repository.CommunityRepositories.ReportRepository;
import com.theunoia.community.repository.CommunityRepositories.ThreadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CategoryRepository categories;
    private final ThreadRepository threads;
    private final ReplyRepository replies;
    private final ReportRepository reports;
    private final NamedParameterJdbcTemplate jdbc;
    private final EventPublisher events;

    public record ThreadCommand(UUID categoryId, String type, String title, String body, List<String> tags) {
    }

    // ------------------------------------------------------------------ threads

    @Transactional(readOnly = true)
    public List<ForumCategory> categories() {
        return categories.findByActiveTrueOrderByPositionAsc();
    }

    /** Feed with filters + PostgreSQL full-text search. sort: latest | top | unanswered | trending. */
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> feed(UUID categoryId, String type, String tag, String q, String sort, int page, int size) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder(" WHERE t.status <> 'HIDDEN'");
        if (categoryId != null) {
            where.append(" AND t.category_id = :categoryId");
            p.addValue("categoryId", categoryId);
        }
        if (type != null && !type.isBlank()) {
            where.append(" AND t.type = :type");
            p.addValue("type", type);
        }
        if (tag != null && !tag.isBlank()) {
            where.append(" AND EXISTS (SELECT 1 FROM thread_tags g WHERE g.thread_id = t.id AND lower(g.tag) = lower(:tag))");
            p.addValue("tag", tag);
        }
        if (q != null && !q.isBlank()) {
            where.append(" AND t.search_vector @@ websearch_to_tsquery('english', :q)");
            p.addValue("q", q);
        }
        if ("unanswered".equals(sort)) where.append(" AND t.reply_count = 0");
        String order = switch (sort == null ? "" : sort) {
            case "top" -> " ORDER BY t.pinned DESC, t.vote_score DESC, t.created_at DESC";
            case "unanswered" -> " ORDER BY t.created_at DESC";
            // Hacker-News style decay: score / (age_hours + 2)^1.5
            case "trending" -> " ORDER BY (t.vote_score + t.reply_count * 2) / power(extract(epoch FROM now() - t.created_at) / 3600 + 2, 1.5) DESC";
            default -> " ORDER BY t.pinned DESC, t.last_activity_at DESC";
        };
        int limit = Math.min(Math.max(size, 1), 100);
        p.addValue("limit", limit).addValue("offset", Math.max(page, 0) * limit);
        Long total = jdbc.queryForObject("SELECT count(*) FROM threads t" + where, p, Long.class);
        List<Map<String, Object>> items = jdbc.query("""
                SELECT t.id, t.category_id, t.author_id, t.type, t.title, left(t.body, 240) AS excerpt, t.status, t.pinned,
                       t.view_count, t.reply_count, t.vote_score, t.accepted_reply_id IS NOT NULL AS answered,
                       t.last_activity_at, t.created_at,
                       (SELECT string_agg(tag, ',') FROM thread_tags g WHERE g.thread_id = t.id) AS tags
                FROM threads t""" + where + order + " LIMIT :limit OFFSET :offset", p, (rs, i) -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", rs.getObject("id", UUID.class));
            m.put("categoryId", rs.getObject("category_id", UUID.class));
            m.put("authorId", rs.getObject("author_id", UUID.class));
            m.put("type", rs.getString("type"));
            m.put("title", rs.getString("title"));
            m.put("excerpt", rs.getString("excerpt"));
            m.put("status", rs.getString("status"));
            m.put("pinned", rs.getBoolean("pinned"));
            m.put("viewCount", rs.getInt("view_count"));
            m.put("replyCount", rs.getInt("reply_count"));
            m.put("voteScore", rs.getInt("vote_score"));
            m.put("answered", rs.getBoolean("answered"));
            m.put("lastActivityAt", rs.getTimestamp("last_activity_at").toInstant());
            m.put("createdAt", rs.getTimestamp("created_at").toInstant());
            String tags = rs.getString("tags");
            m.put("tags", tags == null ? List.of() : Arrays.asList(tags.split(",")));
            return m;
        });
        return PageResponse.of(items, page, limit, total == null ? 0 : total);
    }

    @Transactional
    public Map<String, Object> view(UUID threadId, AuthUser viewer) {
        ForumThread t = threads.findById(threadId).orElseThrow(() -> ApiException.notFound("Thread"));
        boolean moderator = viewer != null && viewer.isAdmin();
        if ("HIDDEN".equals(t.getStatus()) && !moderator) throw ApiException.notFound("Thread");
        jdbc.getJdbcTemplate().update("UPDATE threads SET view_count = view_count + 1 WHERE id = ?", threadId);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("thread", t);
        r.put("replies", moderator ? replies.findByThreadIdOrderByCreatedAtAsc(threadId)
                : replies.findByThreadIdAndStatusOrderByCreatedAtAsc(threadId, "VISIBLE"));
        if (viewer != null) {
            r.put("myVotes", jdbc.getJdbcTemplate().queryForList("""
                    SELECT target_type, target_id, value FROM votes WHERE user_id = ?
                      AND (target_id = ? OR target_id IN (SELECT id FROM replies WHERE thread_id = ?))""", viewer.id(), threadId, threadId));
        }
        return r;
    }

    @Transactional
    public ForumThread create(AuthUser author, ThreadCommand cmd) {
        if (!categories.existsById(cmd.categoryId())) throw ApiException.badRequest("Unknown category");
        ForumThread t = new ForumThread();
        t.setAuthorId(author.id());
        apply(t, cmd);
        threads.save(t);
        events.publish("community.thread_created", Map.of("threadId", t.getId(), "authorId", author.id(), "type", t.getType()));
        return t;
    }

    @Transactional
    public ForumThread update(AuthUser author, UUID threadId, ThreadCommand cmd) {
        ForumThread t = ownThread(author, threadId);
        if ("LOCKED".equals(t.getStatus())) throw ApiException.unprocessable("THREAD_LOCKED", "Thread is locked");
        apply(t, cmd);
        return t;
    }

    @Transactional
    public void delete(AuthUser author, UUID threadId) {
        ownThread(author, threadId).setStatus("HIDDEN");
    }

    // ------------------------------------------------------------------ replies & answers

    @Transactional
    public Reply reply(AuthUser author, UUID threadId, String body) {
        ForumThread t = threads.findById(threadId).filter(x -> !"HIDDEN".equals(x.getStatus()))
                .orElseThrow(() -> ApiException.notFound("Thread"));
        if ("LOCKED".equals(t.getStatus())) throw ApiException.unprocessable("THREAD_LOCKED", "Thread is locked");
        Reply r = new Reply();
        r.setThreadId(threadId);
        r.setAuthorId(author.id());
        r.setBody(body);
        replies.save(r);
        if (!t.getAuthorId().equals(author.id())) {
            events.publish("community.reply_created", Map.of("threadId", threadId, "replyId", r.getId(),
                    "threadAuthorId", t.getAuthorId(), "authorId", author.id(), "threadTitle", t.getTitle()));
        }
        return r;
    }

    @Transactional
    public Reply editReply(AuthUser author, UUID replyId, String body) {
        Reply r = replies.findById(replyId).orElseThrow(() -> ApiException.notFound("Reply"));
        if (!r.getAuthorId().equals(author.id())) throw ApiException.forbidden("Not your reply");
        r.setBody(body);
        return r;
    }

    /** Q&A: the question author accepts the best answer. */
    @Transactional
    public ForumThread acceptAnswer(AuthUser author, UUID threadId, UUID replyId) {
        ForumThread t = ownThread(author, threadId);
        if (!"QUESTION".equals(t.getType())) throw ApiException.unprocessable("NOT_A_QUESTION", "Only questions have accepted answers");
        Reply r = replies.findById(replyId).filter(x -> x.getThreadId().equals(threadId))
                .orElseThrow(() -> ApiException.notFound("Reply"));
        t.setAcceptedReplyId(r.getId());
        return t;
    }

    // ------------------------------------------------------------------ votes, reports, networking

    /** value: 1 (upvote), -1 (downvote), 0 (remove vote). Score maintained by trigger. */
    @Transactional
    public Map<String, Object> vote(AuthUser user, String targetType, UUID targetId, int value) {
        if (!"THREAD".equals(targetType) && !"REPLY".equals(targetType)) throw ApiException.badRequest("Invalid target type");
        boolean exists = "THREAD".equals(targetType) ? threads.existsById(targetId) : replies.existsById(targetId);
        if (!exists) throw ApiException.notFound("Vote target");
        var jt = jdbc.getJdbcTemplate();
        if (value == 0) {
            jt.update("DELETE FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?", user.id(), targetType, targetId);
        } else {
            jt.update("""
                    INSERT INTO votes (user_id, target_type, target_id, value) VALUES (?, ?, ?, ?)
                    ON CONFLICT (user_id, target_type, target_id) DO UPDATE SET value = EXCLUDED.value
                    WHERE votes.value <> EXCLUDED.value""", user.id(), targetType, targetId, (short) Integer.signum(value));
        }
        Integer score = jt.queryForObject("THREAD".equals(targetType)
                ? "SELECT vote_score FROM threads WHERE id = ?" : "SELECT vote_score FROM replies WHERE id = ?", Integer.class, targetId);
        return Map.of("targetType", targetType, "targetId", targetId, "voteScore", score == null ? 0 : score);
    }

    @Transactional
    public ContentReport report(AuthUser user, String targetType, UUID targetId, String reason, String details) {
        ContentReport r = new ContentReport();
        r.setReporterId(user.id());
        r.setTargetType(targetType);
        r.setTargetId(targetId);
        r.setReason(reason);
        r.setDetails(details);
        return reports.save(r);
    }

    @Transactional
    public void follow(AuthUser user, UUID followee, boolean follow) {
        if (user.id().equals(followee)) throw ApiException.badRequest("You cannot follow yourself");
        var jt = jdbc.getJdbcTemplate();
        if (follow) {
            jt.update("INSERT INTO user_follows (follower_id, followee_id) VALUES (?, ?) ON CONFLICT DO NOTHING", user.id(), followee);
        } else {
            jt.update("DELETE FROM user_follows WHERE follower_id = ? AND followee_id = ?", user.id(), followee);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> network(UUID userId) {
        var jt = jdbc.getJdbcTemplate();
        return Map.of(
                "followers", jt.queryForList("SELECT follower_id FROM user_follows WHERE followee_id = ? ORDER BY created_at DESC LIMIT 200", UUID.class, userId),
                "following", jt.queryForList("SELECT followee_id FROM user_follows WHERE follower_id = ? ORDER BY created_at DESC LIMIT 200", UUID.class, userId),
                "followerCount", jt.queryForObject("SELECT count(*) FROM user_follows WHERE followee_id = ?", Long.class, userId),
                "followingCount", jt.queryForObject("SELECT count(*) FROM user_follows WHERE follower_id = ?", Long.class, userId));
    }

    // ------------------------------------------------------------------ moderation (admin)

    @Transactional(readOnly = true)
    public PageResponse<ContentReport> reports(String status, int page, int size) {
        var pageable = Pagination.newestFirst(page, size);
        return PageResponse.of(status == null ? reports.findAll(pageable) : reports.findByStatus(status, pageable), r -> r);
    }

    /** action: HIDE_CONTENT (hides target, actions all open reports on it) | DISMISS */
    @Transactional
    public ContentReport resolveReport(AuthUser admin, UUID reportId, String action) {
        ContentReport report = reports.findById(reportId).orElseThrow(() -> ApiException.notFound("Report"));
        if ("HIDE_CONTENT".equals(action)) {
            moderate(report.getTargetType(), report.getTargetId(), "HIDE");
            for (ContentReport r : reports.findByTargetTypeAndTargetIdAndStatus(report.getTargetType(), report.getTargetId(), "OPEN")) {
                close(r, admin, "ACTIONED");
            }
            if (report.getTargetType().equals("USER")) {
                events.publish("community.user_reported", Map.of("userId", report.getTargetId(), "reportId", reportId));
            }
        } else {
            close(report, admin, "DISMISSED");
        }
        return report;
    }

    /** action: LOCK | UNLOCK | PIN | UNPIN | HIDE | RESTORE */
    @Transactional
    public Object moderate(String targetType, UUID targetId, String action) {
        if ("REPLY".equals(targetType)) {
            Reply r = replies.findById(targetId).orElseThrow(() -> ApiException.notFound("Reply"));
            r.setStatus("RESTORE".equals(action) ? "VISIBLE" : "HIDDEN");
            return r;
        }
        if ("USER".equals(targetType)) return Map.of("userId", targetId, "action", action);
        ForumThread t = threads.findById(targetId).orElseThrow(() -> ApiException.notFound("Thread"));
        switch (action) {
            case "LOCK" -> t.setStatus("LOCKED");
            case "UNLOCK", "RESTORE" -> t.setStatus("OPEN");
            case "PIN" -> t.setPinned(true);
            case "UNPIN" -> t.setPinned(false);
            case "HIDE" -> t.setStatus("HIDDEN");
            default -> throw ApiException.badRequest("Unknown moderation action");
        }
        return t;
    }

    @Transactional
    public ForumCategory saveCategory(UUID id, String name, String description, int position, boolean active) {
        ForumCategory c = id == null ? new ForumCategory() : categories.findById(id).orElseThrow(() -> ApiException.notFound("Category"));
        c.setName(name);
        if (id == null) {
            String slug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
            if (categories.existsBySlug(slug)) throw ApiException.conflict("Category exists");
            c.setSlug(slug);
        }
        c.setDescription(description);
        c.setPosition(position);
        c.setActive(active);
        return categories.save(c);
    }

    private static void close(ContentReport r, AuthUser admin, String status) {
        r.setStatus(status);
        r.setReviewedBy(admin.id());
        r.setReviewedAt(Instant.now());
    }

    private ForumThread ownThread(AuthUser user, UUID threadId) {
        ForumThread t = threads.findById(threadId).orElseThrow(() -> ApiException.notFound("Thread"));
        if (!t.getAuthorId().equals(user.id()) && !user.isAdmin()) throw ApiException.forbidden("Not your thread");
        return t;
    }

    private static void apply(ForumThread t, ThreadCommand cmd) {
        t.setCategoryId(cmd.categoryId());
        t.setType(cmd.type() == null ? "DISCUSSION" : cmd.type());
        t.setTitle(cmd.title().trim());
        t.setBody(cmd.body());
        t.getTags().clear();
        if (cmd.tags() != null) {
            t.getTags().addAll(new LinkedHashSet<>(cmd.tags().stream().map(s -> s.trim().toLowerCase()).filter(s -> !s.isEmpty()).toList()));
        }
    }
}
