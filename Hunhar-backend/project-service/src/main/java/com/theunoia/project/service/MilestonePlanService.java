package com.theunoia.project.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ForbiddenException;
import com.theunoia.common.internal.NotificationPublisher;
import com.theunoia.common.security.AuthUser;
import com.theunoia.project.domain.*;
import com.theunoia.project.domain.MilestonePlan.Status;
import com.theunoia.project.repository.BidRepository;
import com.theunoia.project.repository.MilestonePlanRepository;
import com.theunoia.project.repository.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

/**
 * Milestone plan negotiation after hiring:
 * freelancer drafts -> sends to client -> client accepts, or edits and sends back -> freelancer accepts, or edits and
 * sends again ... -> accepted: the milestones are created and paid one by one (fund -> submit -> approve -> release).
 */
@Service
@RequiredArgsConstructor
public class MilestonePlanService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final BigDecimal MIN_AMOUNT = new BigDecimal("50");
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("10000000");
    private static final int MAX_ITEMS = 20;

    private final MilestonePlanRepository planRepository;
    private final MilestoneRepository milestoneRepository;
    private final BidRepository bidRepository;
    private final ProjectAccessService access;
    private final NotificationPublisher notifications;
    private final ObjectMapper objectMapper;

    /** One milestone in the plan. dueDate is a calendar date (yyyy-MM-dd). */
    public record Item(String title, String description, BigDecimal amount, String dueDate) {}

    // ------------------------------------------------------------------ read

    @Transactional
    public Map<String, Object> view(UUID projectId, AuthUser user) {
        Project p = access.requireParticipant(projectId, user);
        String me = side(p, user);
        MilestonePlan plan = planRepository.findByProjectId(projectId).orElse(null);
        if (plan == null || (plan.getStatus() != Status.ACCEPTED && (plan.getItemsJson() == null || plan.getItemsJson().isBlank() || "[]".equals(plan.getItemsJson().trim())))) {
            plan = initPlanForProject(p, agreedAmount(p));
        }
        // A draft is private to whoever is writing it
        boolean hiddenDraft = plan != null && plan.getStatus() == Status.DRAFT && !plan.getDraftBy().equals(me);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("projectId", projectId);
        m.put("myRole", me);
        m.put("status", plan == null ? "NONE" : plan.getStatus().name());
        m.put("draftBy", plan == null ? null : plan.getDraftBy());
        m.put("round", plan == null ? 0 : plan.getRound());
        m.put("revisions", plan == null ? 0 : plan.getRevisions());
        m.put("items", plan == null || hiddenDraft ? List.of() : items(plan));
        m.put("note", plan == null || hiddenDraft ? null : plan.getNote());
        m.put("lastEditedBy", plan == null ? null : plan.getLastEditedBy());
        m.put("lastEditedAt", plan == null ? null : plan.getLastEditedAt());
        m.put("acceptedAt", plan == null ? null : plan.getAcceptedAt());
        m.put("agreedAmount", agreedAmount(p));
        m.put("milestonesTotal", milestoneRepository.findByProjectId(projectId).stream()
                .map(Milestone::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
        m.put("canEdit", canEdit(p, plan, me));
        m.put("canAccept", canAccept(p, plan, me));
        m.put("subCategory", p.getSubCategory());
        List<String> defaultPhases = p.getPhases() != null && !p.getPhases().isBlank()
                ? List.of(p.getPhases().split("\\|\\|"))
                : SkillPhasesCatalogue.getPhasesForSkill(p.getSubCategory(), p.getCategory(), p.getTitle());
        m.put("defaultPhases", defaultPhases);
        m.put("canStartRound", p.getStatus() == ProjectStatus.ACTIVE && !"ADMIN".equals(me)
                && (plan == null ? "FREELANCER".equals(me) : plan.getStatus() == Status.ACCEPTED));
        return m;
    }

    @Transactional
    public MilestonePlan initPlanForProject(Project p, BigDecimal agreedAmount) {
        if (agreedAmount == null || agreedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            agreedAmount = p.getBudget() != null ? p.getBudget() : BigDecimal.valueOf(1000);
        }
        List<String> phaseList = new ArrayList<>();
        if (p.getPhases() != null && !p.getPhases().isBlank()) {
            for (String s : p.getPhases().split("\\|\\|")) {
                String trimmed = s.trim();
                if (!trimmed.isEmpty()) phaseList.add(trimmed);
            }
        }
        if (phaseList.isEmpty()) {
            phaseList.addAll(SkillPhasesCatalogue.getPhasesForSkill(p.getSubCategory(), p.getCategory(), p.getTitle()));
        }

        int count = Math.max(1, phaseList.size());
        BigDecimal total = agreedAmount;
        BigDecimal perPhase = total.divide(BigDecimal.valueOf(count), 0, RoundingMode.HALF_UP);
        List<Item> items = new ArrayList<>();
        BigDecimal accumulated = BigDecimal.ZERO;
        for (int i = 0; i < count; i++) {
            BigDecimal amt;
            if (i == count - 1) {
                amt = total.subtract(accumulated);
                if (amt.compareTo(BigDecimal.ZERO) < 0) amt = BigDecimal.ZERO;
            } else {
                amt = perPhase;
                accumulated = accumulated.add(amt);
            }
            items.add(new Item(
                    phaseList.get(i),
                    "Phase " + (i + 1) + " deliverable checkpoint",
                    amt,
                    null
            ));
        }

        String itemsJson = "[]";
        try {
            itemsJson = objectMapper.writeValueAsString(items);
        } catch (Exception ignored) {}

        MilestonePlan plan = planRepository.findByProjectId(p.getId()).orElse(null);
        if (plan == null) {
            plan = MilestonePlan.builder()
                    .projectId(p.getId())
                    .status(Status.WITH_FREELANCER)
                    .draftBy("CLIENT")
                    .itemsJson(itemsJson)
                    .note("Default milestone plan proposed by client based on project checkpoint phases")
                    .round(1)
                    .revisions(0)
                    .lastEditedBy("CLIENT")
                    .lastEditedAt(Instant.now())
                    .build();
        } else if (plan.getStatus() != Status.ACCEPTED && plan.getRound() <= 1) {
            plan.setItemsJson(itemsJson);
            plan.setStatus(Status.WITH_FREELANCER);
            plan.setDraftBy("CLIENT");
            plan.setLastEditedBy("CLIENT");
            plan.setLastEditedAt(Instant.now());
        }
        return planRepository.save(plan);
    }

    private List<String> defaultPhasesForCategory(String category) {
        return SkillPhasesCatalogue.getPhasesForSkill(null, category, null);
    }

    // ------------------------------------------------------------------ write

    /** Save the plan without sending it (draft, or edits while it is your turn). */
    @Transactional
    public Map<String, Object> save(UUID projectId, List<Item> items, String note, AuthUser user) {
        Project p = active(projectId, user);
        String me = side(p, user);
        MilestonePlan plan = planRepository.findByProjectId(projectId).orElse(null);
        if (plan == null) {
            plan = initPlanForProject(p, agreedAmount(p));
        }
        if (!canEdit(p, plan, me)) throw new BadRequestException(waitMessage(plan, me));
        write(plan, items, note, me);
        planRepository.save(plan);
        return view(projectId, user);
    }

    /** Send the plan (with your edits) to the other side. */
    @Transactional
    public Map<String, Object> send(UUID projectId, List<Item> items, String note, AuthUser user) {
        Project p = active(projectId, user);
        String me = side(p, user);
        MilestonePlan plan = planRepository.findByProjectId(projectId).orElse(null);
        if (plan == null) {
            plan = initPlanForProject(p, agreedAmount(p));
        }
        if (!canEdit(p, plan, me)) throw new BadRequestException(waitMessage(plan, me));
        if (items != null) write(plan, items, note, me);
        if (items(plan).isEmpty()) throw new BadRequestException("Add at least one milestone before sending");
        boolean wasDraft = plan.getStatus() == Status.DRAFT;
        plan.setStatus("FREELANCER".equals(me) ? Status.WITH_CLIENT : Status.WITH_FREELANCER);
        if (!wasDraft) plan.setRevisions(plan.getRevisions() + 1);
        plan.setLastEditedBy(me);
        plan.setLastEditedAt(Instant.now());
        planRepository.save(plan);

        BigDecimal total = total(items(plan));
        if ("FREELANCER".equals(me)) {
            notifications.notify(p.getClientId(), "MILESTONE_PLAN", wasDraft ? "Milestone plan received" : "Milestone plan updated",
                    "The freelancer " + (wasDraft ? "proposed" : "updated") + " " + items(plan).size() + " milestone(s) totalling ₹"
                            + total.toPlainString() + " for \"" + p.getTitle() + "\". Review and accept or edit it.",
                    "/client/projects/" + p.getId());
        } else {
            notifications.notify(p.getAwardedFreelancerId(), "MILESTONE_PLAN", "Client proposed the milestone plan",
                    "The client proposed the milestone plan for \"" + p.getTitle() + "\" (total ₹" + total.toPlainString()
                            + "). Review and accept or edit it.",
                    "/freelancer/projects/" + p.getId());
        }
        return view(projectId, user);
    }

    /** Accept the plan you received: the milestones are created and can be funded. */
    @Transactional
    public Map<String, Object> accept(UUID projectId, AuthUser user) {
        Project p = active(projectId, user);
        String me = side(p, user);
        MilestonePlan plan = planRepository.findByProjectId(projectId)
                .orElseThrow(() -> new BadRequestException("There is no milestone plan to accept yet"));
        if (!canAccept(p, plan, me)) throw new BadRequestException(waitMessage(plan, me));
        List<Item> list = items(plan);
        if (list.isEmpty()) throw new BadRequestException("The plan has no milestones");

        for (Item it : list) {
            Instant dueDate = null;
            if (it.dueDate() != null && !it.dueDate().isBlank()) {
                try {
                    String d = it.dueDate().trim();
                    if (d.length() > 10) d = d.substring(0, 10);
                    dueDate = LocalDate.parse(d).atTime(18, 0).atZone(IST).toInstant();
                } catch (Exception ignored) {}
            }
            milestoneRepository.save(Milestone.builder()
                    .projectId(projectId)
                    .title(it.title())
                    .description(it.description())
                    .amount(it.amount())
                    .dueDate(dueDate)
                    .status(MilestoneStatus.PENDING)
                    .build());
        }
        plan.setStatus(Status.ACCEPTED);
        plan.setAcceptedAt(Instant.now());
        plan.setLastEditedBy(me);
        plan.setLastEditedAt(Instant.now());
        planRepository.save(plan);

        UUID other = "CLIENT".equals(me) ? p.getAwardedFreelancerId() : p.getClientId();
        String link = "CLIENT".equals(me) ? "/freelancer/projects/" + p.getId() : "/client/projects/" + p.getId();
        notifications.notify(other, "MILESTONE_PLAN", "Milestone plan accepted ✅",
                ("CLIENT".equals(me) ? "The client" : "The freelancer") + " accepted the milestone plan for \"" + p.getTitle() + "\" ("
                        + list.size() + " milestone(s), ₹" + total(list).toPlainString() + ")."
                        + ("CLIENT".equals(me) ? " Work starts as each milestone is funded." : " Fund the first milestone to start the work."),
                link);
        return view(projectId, user);
    }

    /** After a plan was accepted, either side can propose more milestones (a new round). */
    @Transactional
    public Map<String, Object> startRound(UUID projectId, AuthUser user) {
        Project p = active(projectId, user);
        String me = side(p, user);
        if ("ADMIN".equals(me)) throw new ForbiddenException("Only the client or the freelancer can change the plan");
        MilestonePlan plan = planRepository.findByProjectId(projectId).orElse(null);
        if (plan == null) {
            plan = initPlanForProject(p, agreedAmount(p));
        } else if (plan.getStatus() != Status.ACCEPTED) {
            throw new BadRequestException("Finish agreeing the current plan first");
        } else {
            plan.setRound(plan.getRound() + 1);
        }
        plan.setStatus(Status.DRAFT);
        plan.setDraftBy(me);
        plan.setItemsJson("[]");
        plan.setNote(null);
        plan.setRevisions(0);
        plan.setAcceptedAt(null);
        planRepository.save(plan);
        return view(projectId, user);
    }

    // ------------------------------------------------------------------ rules

    private boolean canEdit(Project p, MilestonePlan plan, String me) {
        if (p.getStatus() != ProjectStatus.ACTIVE || "ADMIN".equals(me)) return false;
        if (plan == null) return true;
        return switch (plan.getStatus()) {
            case DRAFT -> me.equals(plan.getDraftBy());
            case WITH_CLIENT -> "CLIENT".equals(me);
            case WITH_FREELANCER -> "FREELANCER".equals(me);
            case ACCEPTED -> false;
        };
    }

    private boolean canAccept(Project p, MilestonePlan plan, String me) {
        if (p.getStatus() != ProjectStatus.ACTIVE || plan == null) return false;
        return (plan.getStatus() == Status.WITH_CLIENT && "CLIENT".equals(me))
                || (plan.getStatus() == Status.WITH_FREELANCER && "FREELANCER".equals(me));
    }

    private static String waitMessage(MilestonePlan plan, String me) {
        if (plan == null) return "The milestone plan is being prepared";
        return switch (plan.getStatus()) {
            case DRAFT -> "The " + plan.getDraftBy().toLowerCase() + " is still preparing the plan";
            case WITH_CLIENT -> "CLIENT".equals(me) ? "Review the plan" : "The plan is with the client for review";
            case WITH_FREELANCER -> "FREELANCER".equals(me) ? "Review the plan" : "The plan is with the freelancer for review & acceptance";
            case ACCEPTED -> "This plan is already accepted. Start a new round to add milestones.";
        };
    }

    /** CLIENT, FREELANCER (awarded lead freelancer) or ADMIN (read-only). */
    private String side(Project p, AuthUser user) {
        if (access.isClient(p, user.id())) return "CLIENT";
        if (access.isAwardedFreelancer(p, user.id())) return "FREELANCER";
        if (user.hasRole("ADMIN")) return "ADMIN";
        throw new ForbiddenException("Only the client and the hired freelancer can see the milestone plan");
    }

    private Project active(UUID projectId, AuthUser user) {
        Project p = access.requireParticipant(projectId, user);
        if (p.getStatus() != ProjectStatus.ACTIVE) throw new BadRequestException("The milestone plan can only be changed on active projects");
        return p;
    }

    private BigDecimal agreedAmount(Project p) {
        if (p.getAwardedFreelancerId() == null) return p.getBudget();
        return bidRepository.findByProjectIdAndFreelancerId(p.getId(), p.getAwardedFreelancerId())
                .map(Bid::getProposedCost).orElse(p.getBudget());
    }

    // ------------------------------------------------------------------ items

    private void write(MilestonePlan plan, List<Item> raw, String note, String me) {
        List<Item> clean = validate(raw);
        try {
            plan.setItemsJson(objectMapper.writeValueAsString(clean));
        } catch (Exception e) {
            throw new BadRequestException("Could not save the plan");
        }
        String n = note == null ? null : note.trim();
        plan.setNote(n == null || n.isEmpty() ? null : n.length() > 600 ? n.substring(0, 600) : n);
        plan.setLastEditedBy(me);
        plan.setLastEditedAt(Instant.now());
    }

    private List<Item> validate(List<Item> raw) {
        if (raw == null) return List.of();
        if (raw.size() > MAX_ITEMS) throw new BadRequestException("A plan can have at most " + MAX_ITEMS + " milestones");
        LocalDate today = LocalDate.now(IST);
        List<Item> out = new ArrayList<>();
        int i = 0;
        for (Item it : raw) {
            i++;
            String title = it.title() == null ? "" : it.title().trim();
            if (title.length() < 3 || title.length() > 150) throw new BadRequestException("Milestone " + i + ": title must be 3-150 characters");
            if (it.amount() == null || it.amount().compareTo(MIN_AMOUNT) < 0) {
                throw new BadRequestException("Milestone " + i + ": amount must be at least ₹" + MIN_AMOUNT.toPlainString());
            }
            if (it.amount().compareTo(MAX_AMOUNT) > 0) throw new BadRequestException("Milestone " + i + ": amount is too large");
            String due = it.dueDate() == null || it.dueDate().isBlank() ? null : it.dueDate().trim();
            if (due != null) {
                if (due.length() > 10) due = due.substring(0, 10); // accept ISO date-times
                LocalDate d;
                try {
                    d = LocalDate.parse(due);
                } catch (Exception e) {
                    throw new BadRequestException("Milestone " + i + ": invalid due date");
                }
                if (d.isBefore(today)) throw new BadRequestException("Milestone " + i + ": due date cannot be in the past");
            }
            String desc = it.description() == null ? null : it.description().trim();
            if (desc != null && desc.length() > 1000) desc = desc.substring(0, 1000);
            out.add(new Item(title, desc == null || desc.isEmpty() ? null : desc,
                    it.amount().setScale(2, RoundingMode.HALF_UP), due));
        }
        return out;
    }

    private List<Item> items(MilestonePlan plan) {
        if (plan.getItemsJson() == null || plan.getItemsJson().isBlank()) return List.of();
        try {
            return objectMapper.readValue(plan.getItemsJson(), new TypeReference<List<Item>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private static BigDecimal total(List<Item> items) {
        return items.stream().map(Item::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
