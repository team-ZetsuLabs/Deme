package dev.zetsu.moderation;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.moderation.ModerationDtos.AppealRequest;
import dev.zetsu.moderation.ModerationDtos.CaseDecisionRequest;
import dev.zetsu.moderation.ModerationDtos.ModerationDecision;
import dev.zetsu.moderation.ModerationDtos.ModerationTarget;
import dev.zetsu.moderation.ModerationDtos.MyModeratedContent;
import dev.zetsu.moderation.ModerationDtos.ReasonCount;
import dev.zetsu.moderation.ModerationDtos.ReportReceipt;
import dev.zetsu.moderation.ModerationDtos.ReportRequest;
import dev.zetsu.notification.NotificationDtos.NotificationTarget;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.reputation.Level;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Modération par la communauté (MOD-1 à MOD-3). Signaler à partir du niveau Membre, voir la file à partir de
 * Contributeur, ignorer ou masquer à partir de Référent ; l'équipe a tous les droits. L'auteur d'un contenu masqué
 * le voit toujours et peut contester la décision une fois.
 */
@Service
public class ModerationService {

    private static final int MAX_COMMENTS = 5;
    private static final Set<CaseStatus> QUEUE = Set.of(CaseStatus.OPEN, CaseStatus.HIDDEN);
    private static final Set<CaseStatus> SHOWN_TO_AUTHOR =
            Set.of(CaseStatus.HIDDEN, CaseStatus.APPEALED, CaseStatus.RESTORED);

    private final ModerationCaseRepository cases;
    private final ReportRepository reports;
    private final ModerationTargets targets;
    private final ModerationProperties props;
    private final UserRepository users;
    private final ReputationService reputation;
    private final NotificationService notifications;

    public ModerationService(ModerationCaseRepository cases, ReportRepository reports, ModerationTargets targets,
                             ModerationProperties props, UserRepository users, ReputationService reputation,
                             NotificationService notifications) {
        this.cases = cases;
        this.reports = reports;
        this.targets = targets;
        this.props = props;
        this.users = users;
        this.reputation = reputation;
        this.notifications = notifications;
    }

    @Transactional
    public ReportReceipt report(ReportRequest req, ZetsuPrincipal me) {
        requireLevel(me, Level.MEMBER);
        ModerationTargets.Target target = targets.find(req.targetType(), req.targetId())
                .orElseThrow(() -> ApiException.notFound("TARGET_NOT_FOUND", "Contenu introuvable"));
        if (target.authorId().equals(me.id())) {
            throw ApiException.forbidden("CANNOT_REPORT_OWN", "Impossible de signaler son propre contenu");
        }
        cases.createIfAbsent(req.targetType().name(), req.targetId(), target.authorId());
        ModerationCase c = cases.lockByTarget(req.targetType(), req.targetId()).orElseThrow();
        if (reports.existsByCaseIdAndReporterId(c.getId(), me.id())) {
            throw ApiException.conflict("ALREADY_REPORTED", "Vous avez déjà signalé ce contenu");
        }
        reports.save(new Report(c.getId(), me.id(), req.reason(), blankToNull(req.comment())));
        c.addReport();
        if (c.getStatus() == CaseStatus.DISMISSED) {
            c.reopen();
        }
        // Seulement au franchissement du seuil : un contenu qu'un Référent a choisi d'ignorer n'est pas remasqué au
        // signalement suivant, et un contenu déjà jugé (masqué, contesté, rétabli) ne bouge plus.
        boolean hideNow = c.getStatus() == CaseStatus.OPEN && c.getDecidedAt() == null
                && c.getReportCount() == props.autoHideThreshold();
        if (hideNow) {
            c.autoHide();
            targets.setHidden(c.getTargetType(), c.getTargetId(), true);
            notifyAuthor(c, target, NotificationType.CONTENT_HIDDEN);
        }
        return new ReportReceipt(c.getId(), hideNow);
    }

    @Transactional(readOnly = true)
    public PageResponse<ModerationDtos.ModerationCase> queue(ReportTargetType type, int page, int size,
                                                             ZetsuPrincipal me) {
        requireLevel(me, Level.CONTRIBUTOR);
        Page<ModerationCase> result = cases.findQueue(QUEUE, type, me.id(), Paging.of(page, size));
        List<ModerationDtos.ModerationCase> items = toDtos(result.getContent());
        return new PageResponse<>(items, result.getNumber(), result.getSize(), result.getTotalElements());
    }

    @Transactional
    public ModerationDtos.ModerationCase decide(Long id, CaseDecisionRequest req, ZetsuPrincipal me) {
        requireLevel(me, Level.REFERENT);
        if (req.action() != ModerationAction.DISMISS && req.action() != ModerationAction.HIDE) {
            throw ApiException.badRequest("ACTION_NOT_ALLOWED", "Un Référent peut seulement ignorer ou masquer");
        }
        String note = blankToNull(req.note());
        if (req.action() == ModerationAction.HIDE && note == null) {
            throw ApiException.badRequest("NOTE_REQUIRED", "Le motif est obligatoire pour masquer");
        }
        ModerationCase c = cases.lockById(id).orElseThrow(ModerationService::caseNotFound);
        if (c.getTargetAuthorId().equals(me.id())) {
            throw ApiException.forbidden("CANNOT_MODERATE_OWN", "Impossible de modérer son propre contenu");
        }
        if (c.getDecidedAt() != null || !QUEUE.contains(c.getStatus())) {
            throw ApiException.conflict("CASE_ALREADY_DECIDED", "Ce signalement a déjà été traité");
        }
        ModerationTargets.Target target = targets.find(c.getTargetType(), c.getTargetId()).orElseThrow();
        boolean wasHidden = c.getStatus() == CaseStatus.HIDDEN;
        if (req.action() == ModerationAction.HIDE) {
            c.decide(ModerationAction.HIDE, note, me.id(), me.staff(), CaseStatus.HIDDEN);
            targets.setHidden(c.getTargetType(), c.getTargetId(), true);
            if (!wasHidden) {
                notifyAuthor(c, target, NotificationType.CONTENT_HIDDEN);
            }
        } else {
            c.decide(ModerationAction.DISMISS, note, me.id(), me.staff(), CaseStatus.DISMISSED);
            if (wasHidden) {
                targets.setHidden(c.getTargetType(), c.getTargetId(), false);
                notifyAuthor(c, target, NotificationType.CONTENT_RESTORED);
            }
        }
        return toDtos(List.of(c)).get(0);
    }

    @Transactional
    public MyModeratedContent appeal(Long id, AppealRequest req, ZetsuPrincipal me) {
        ModerationCase c = cases.lockById(id).orElseThrow(ModerationService::caseNotFound);
        if (!c.getTargetAuthorId().equals(me.id())) {
            throw ApiException.forbidden("FORBIDDEN", "Seul l'auteur du contenu peut contester");
        }
        if (c.getAppeal() != null) {
            throw ApiException.conflict("ALREADY_APPEALED", "Cette décision a déjà été contestée");
        }
        if (c.getStatus() != CaseStatus.HIDDEN) {
            throw ApiException.conflict("CASE_NOT_HIDDEN", "Ce contenu n'est pas masqué");
        }
        c.appeal(req.message().trim());
        return toMine(c);
    }

    @Transactional(readOnly = true)
    public PageResponse<MyModeratedContent> mine(int page, int size, ZetsuPrincipal me) {
        return PageResponse.of(cases.findByTargetAuthorIdAndStatusInOrderByUpdatedAtDescIdDesc(
                me.id(), SHOWN_TO_AUTHOR, Paging.of(page, size)), this::toMine);
    }

    /** L'équipe n'a pas de niveau à atteindre ; les autres membres, si (section 8). */
    private void requireLevel(ZetsuPrincipal me, Level level) {
        if (me.staff()) {
            return;
        }
        int rep = users.findById(me.id()).map(User::getReputation).orElse(0);
        if (!reputation.levelOf(rep).atLeast(level)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "LEVEL_TOO_LOW",
                    "Votre niveau ne permet pas encore cette action");
        }
    }

    /** Sans acteur : un Référent ou l'équipe décide sans être nommé à l'auteur. */
    private void notifyAuthor(ModerationCase c, ModerationTargets.Target target, NotificationType type) {
        NotificationTargetType targetType = NotificationTargetType.valueOf(c.getTargetType().name());
        // Pour une réponse, le titre affiché est celui de la question, comme pour les autres notifications.
        String title = c.getTargetType() == ReportTargetType.ANSWER
                ? targets.find(ReportTargetType.QUESTION, target.questionId()).map(ModerationTargets.Target::title)
                .orElse(target.title())
                : target.title();
        notifications.notify(c.getTargetAuthorId(), type, null,
                new NotificationTarget(targetType, c.getTargetId(), title, target.questionId()), null);
    }

    private List<ModerationDtos.ModerationCase> toDtos(List<ModerationCase> list) {
        if (list.isEmpty()) {
            return List.of();
        }
        List<Long> ids = list.stream().map(ModerationCase::getId).toList();
        Map<Long, List<ReasonCount>> reasons = cases.reasonCounts(ids).stream().collect(Collectors.groupingBy(
                ModerationCaseRepository.ReasonCountRow::getCaseId,
                Collectors.mapping(r -> new ReasonCount(r.getReason(), r.getCount()), Collectors.toList())));
        Map<Long, List<String>> comments = cases.comments(ids).stream().collect(Collectors.groupingBy(
                ModerationCaseRepository.CommentRow::getCaseId,
                Collectors.mapping(ModerationCaseRepository.CommentRow::getComment, Collectors.toList())));
        Map<Long, AuthorSummary> authors = authors(list);
        List<ModerationDtos.ModerationCase> out = new ArrayList<>();
        for (ModerationCase c : list) {
            List<ReasonCount> r = new ArrayList<>(reasons.getOrDefault(c.getId(), List.of()));
            r.sort(Comparator.comparingLong(ReasonCount::count).reversed()
                    .thenComparing(rc -> rc.reason().name()));
            List<String> cm = comments.getOrDefault(c.getId(), List.of());
            out.add(new ModerationDtos.ModerationCase(c.getId(), target(c, authors), c.getStatus(), c.getReportCount(),
                    r, cm.subList(0, Math.min(MAX_COMMENTS, cm.size())), decision(c), c.getAppeal(),
                    c.getFirstReportedAt(), c.getUpdatedAt()));
        }
        return out;
    }

    private MyModeratedContent toMine(ModerationCase c) {
        boolean canAppeal = c.getStatus() == CaseStatus.HIDDEN && c.getAppeal() == null;
        return new MyModeratedContent(c.getId(), target(c, authors(List.of(c))), c.getStatus(), decision(c),
                canAppeal, c.getUpdatedAt());
    }

    private Map<Long, AuthorSummary> authors(List<ModerationCase> list) {
        Set<Long> ids = list.stream().map(ModerationCase::getTargetAuthorId).collect(Collectors.toSet());
        return users.findAllById(ids).stream().collect(Collectors.toMap(User::getId,
                u -> AuthorSummary.from(u, reputation.levelOf(u.getReputation())), (a, b) -> a));
    }

    private ModerationTarget target(ModerationCase c, Map<Long, AuthorSummary> authors) {
        ModerationTargets.Target t = targets.find(c.getTargetType(), c.getTargetId())
                .orElse(new ModerationTargets.Target(c.getTargetAuthorId(), "", null, null, false));
        return new ModerationTarget(c.getTargetType(), c.getTargetId(), t.title(), t.excerpt(), t.questionId(),
                authors.get(c.getTargetAuthorId()));
    }

    private static ModerationDecision decision(ModerationCase c) {
        if (c.getDecidedAt() == null) {
            return null;
        }
        return new ModerationDecision(c.getDecisionAction(), c.getDecisionNote(),
                Boolean.TRUE.equals(c.getDecidedByTeam()), c.getDecidedAt());
    }

    private static ApiException caseNotFound() {
        return ApiException.notFound("CASE_NOT_FOUND", "Signalement introuvable");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
