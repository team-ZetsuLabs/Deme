package dev.zetsu.challenge;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.challenge.ChallengeDtos.AdminSubmission;
import dev.zetsu.challenge.ChallengeDtos.ChallengeRequest;
import dev.zetsu.challenge.ChallengeDtos.LeaderboardEntry;
import dev.zetsu.challenge.ChallengeDtos.MySubmission;
import dev.zetsu.challenge.ChallengeDtos.SubmissionRequest;
import dev.zetsu.challenge.ChallengeDtos.SubmissionReviewRequest;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Défis (CH-1 à CH-3) : un seul défi à la fois, un dépôt GitHub par membre, notation par l'équipe. */
@Service
public class ChallengeService {

    private static final int MAX_TECHNOLOGIES = 5;

    private final ChallengeRepository challenges;
    private final SubmissionRepository submissions;
    private final UserRepository users;
    private final TagService tags;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;
    private final NotificationService notifications;
    private Clock clock = Clock.systemUTC();

    public ChallengeService(ChallengeRepository challenges, SubmissionRepository submissions, UserRepository users,
                            TagService tags, MarkdownRenderer markdown, ReputationService reputation,
                            NotificationService notifications) {
        this.challenges = challenges;
        this.submissions = submissions;
        this.users = users;
        this.tags = tags;
        this.markdown = markdown;
        this.reputation = reputation;
        this.notifications = notifications;
    }

    /** Pour les tests : avancer l'heure sans attendre. */
    void setClock(Clock clock) {
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ChallengeDtos.Challenge current(ZetsuPrincipal me) {
        Instant now = clock.instant();
        Challenge c = challenges.findCurrent(now, PageRequest.of(0, 1)).stream().findFirst()
                .orElseThrow(() -> ApiException.notFound("NO_CURRENT_CHALLENGE", "Aucun défi en cours"));
        return toDto(c, now, me);
    }

    /** Un défi qui n'a pas commencé n'existe que dans le back office. */
    @Transactional(readOnly = true)
    public ChallengeDtos.Challenge get(Long id, ZetsuPrincipal me) {
        Instant now = clock.instant();
        Challenge c = load(id);
        if (c.statusAt(now) == ChallengeStatus.UPCOMING) {
            throw notFound();
        }
        return toDto(c, now, me);
    }

    @Transactional
    public MySubmission submit(Long id, SubmissionRequest req, ZetsuPrincipal me) {
        Instant now = clock.instant();
        Challenge c = load(id);
        ChallengeStatus status = c.statusAt(now);
        if (status == ChallengeStatus.UPCOMING) {
            throw notFound();
        }
        if (status != ChallengeStatus.OPEN) {
            throw ApiException.conflict("CHALLENGE_NOT_OPEN", "Les dépôts sont fermés pour ce défi");
        }
        if (submissions.existsByChallengeIdAndMemberId(id, me.id())) {
            throw ApiException.conflict("ALREADY_SUBMITTED", "Vous avez déjà déposé un dépôt pour ce défi");
        }
        String url = req.repositoryUrl().trim().replaceAll("/+$", "");
        Submission s = submissions.saveAndFlush(new Submission(id, users.getReferenceById(me.id()), url,
                blankToNull(req.comment())));
        return toMine(s);
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaderboardEntry> leaderboard(Long id, int page, int size) {
        Paging.of(page, size);
        Challenge c = load(id);
        if (c.statusAt(clock.instant()) == ChallengeStatus.UPCOMING) {
            throw notFound();
        }
        List<SubmissionRepository.LeaderboardRow> rows = submissions.leaderboard(id, size, (long) page * size);
        Map<Long, Submission> byId = rows.isEmpty() ? Map.of()
                : submissions.findAllDetailed(rows.stream().map(SubmissionRepository.LeaderboardRow::getId).toList())
                .stream().collect(Collectors.toMap(Submission::getId, Function.identity()));
        List<LeaderboardEntry> items = rows.stream().map(r -> {
            Submission s = byId.get(r.getId());
            return new LeaderboardEntry(r.getRank(), author(s.getMember()), s.getScore(), s.getSubmittedAt());
        }).toList();
        return new PageResponse<>(items, page, size, submissions.countValidated(id));
    }

    // --- Back office -------------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public PageResponse<ChallengeDtos.Challenge> teamList(ChallengeStatus status, int page, int size) {
        Instant now = clock.instant();
        Page<Challenge> result = challenges.findForTeam(status == null ? null : status.name(), now,
                Paging.of(page, size));
        return PageResponse.of(result, c -> toDto(c, now, null));
    }

    @Transactional
    public ChallengeDtos.Challenge create(ChallengeRequest req, ZetsuPrincipal me) {
        Instant now = clock.instant();
        checkPeriod(req, now);
        challenges.lockForWrite();
        if (challenges.overlaps(req.startsAt(), req.endsAt(), null)) {
            throw overlap();
        }
        Challenge c = new Challenge(me.id());
        c.setTitle(req.title().trim());
        c.setPeriod(req.startsAt(), req.endsAt());
        c.setTechnologies(tags.resolve(req.technologies(), 0, MAX_TECHNOLOGIES));
        applyTexts(c, req);
        challenges.saveAndFlush(c);
        notifyIfStarted(c, now);
        return toDto(c, now, null);
    }

    /** Avant le début, tout change ; ensuite, seulement l'énoncé, les spécifications et une fin repoussée. */
    @Transactional
    public ChallengeDtos.Challenge update(Long id, ChallengeRequest req) {
        Instant now = clock.instant();
        checkPeriod(req, now);
        challenges.lockForWrite();
        Challenge c = load(id);
        if (c.statusAt(now) != ChallengeStatus.UPCOMING) {
            List<String> names = c.getTechnologies().stream().map(Tag::getName).toList();
            List<String> asked = req.technologies().stream().map(TagService::normalize).toList();
            boolean frozenChanged = !c.getTitle().equals(req.title().trim()) || !c.getStartsAt().equals(req.startsAt())
                    || req.endsAt().isBefore(c.getEndsAt()) || !names.equals(asked);
            if (frozenChanged) {
                throw ApiException.conflict("CHALLENGE_STARTED",
                        "Défi commencé : seuls l'énoncé, les spécifications et une fin repoussée peuvent changer");
            }
        }
        if (challenges.overlaps(req.startsAt(), req.endsAt(), id)) {
            throw overlap();
        }
        c.setTitle(req.title().trim());
        c.setPeriod(req.startsAt(), req.endsAt());
        c.setTechnologies(tags.resolve(req.technologies(), 0, MAX_TECHNOLOGIES));
        applyTexts(c, req);
        c.touch();
        challenges.saveAndFlush(c);
        notifyIfStarted(c, now);
        return toDto(c, now, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminSubmission> submissionsFor(Long id, SubmissionStatus status, int page, int size) {
        load(id);
        return PageResponse.of(submissions.findForReview(id, status, Paging.of(page, size)), this::toAdmin);
    }

    /** CH-3 : +20 la première fois qu'un dépôt est validé, retirés s'il est ensuite refusé. */
    @Transactional
    public AdminSubmission review(Long id, SubmissionReviewRequest req, ZetsuPrincipal me) {
        if (req.status() == SubmissionStatus.PENDING) {
            throw ApiException.badRequest("VALIDATION_ERROR", "VALIDATED ou REJECTED attendu");
        }
        Submission s = submissions.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("SUBMISSION_NOT_FOUND", "Dépôt introuvable"));
        s.review(req.status(), req.score(), blankToNull(req.feedback()), me.id());
        Long memberId = s.getMember().getId();
        if (req.status() == SubmissionStatus.VALIDATED) {
            reputation.grantForSubmission(memberId, s.getId());
        } else {
            reputation.revokeForSubmission(memberId, s.getId());
        }
        Challenge c = load(s.getChallengeId());
        notifications.notify(memberId, NotificationType.SUBMISSION_REVIEWED, null,
                NotificationService.target(NotificationTargetType.CHALLENGE, c.getId(), c.getTitle()),
                req.status().name());
        return toAdmin(s);
    }

    /** NOT-1 : prévient tous les membres quand un défi commence, une seule fois. */
    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT30S")
    @Transactional
    public void notifyStartedChallenges() {
        Instant now = clock.instant();
        challenges.findStartedNotNotified(now).forEach(c -> notifyIfStarted(c, now));
    }

    private void notifyIfStarted(Challenge c, Instant now) {
        if (c.statusAt(now) == ChallengeStatus.OPEN && !c.isStartNotified()) {
            c.markStartNotified();
            notifications.notifyAllActive(NotificationType.CHALLENGE_STARTED,
                    NotificationService.target(NotificationTargetType.CHALLENGE, c.getId(), c.getTitle()));
        }
    }

    private void checkPeriod(ChallengeRequest req, Instant now) {
        if (!req.endsAt().isAfter(req.startsAt()) || !req.endsAt().isAfter(now)) {
            throw ApiException.badRequest("INVALID_PERIOD", "La fin doit être après le début et dans le futur");
        }
    }

    private void applyTexts(Challenge c, ChallengeRequest req) {
        c.setStatement(req.statement(), markdown.toSafeHtml(req.statement()));
        c.setSpecifications(req.specifications(), markdown.toSafeHtml(req.specifications()));
    }

    private Challenge load(Long id) {
        return challenges.findDetailed(id).orElseThrow(ChallengeService::notFound);
    }

    private ChallengeDtos.Challenge toDto(Challenge c, Instant now, ZetsuPrincipal me) {
        MySubmission mine = me == null ? null
                : submissions.findByChallengeIdAndMemberId(c.getId(), me.id()).map(this::toMine).orElse(null);
        return new ChallengeDtos.Challenge(c.getId(), c.getTitle(), c.getStatementMarkdown(), c.getStatementHtml(),
                c.getSpecificationsMarkdown(), c.getSpecificationsHtml(),
                c.getTechnologies().stream().map(Tag::getName).toList(), c.statusAt(now), c.getStartsAt(),
                c.getEndsAt(), now, submissions.countByChallengeId(c.getId()), mine);
    }

    private MySubmission toMine(Submission s) {
        return new MySubmission(s.getId(), s.getRepositoryUrl(), s.getStatus(), s.getScore(), s.getFeedback(),
                s.getSubmittedAt());
    }

    private AdminSubmission toAdmin(Submission s) {
        return new AdminSubmission(s.getId(), s.getChallengeId(), author(s.getMember()), s.getRepositoryUrl(),
                s.getComment(), s.getStatus(), s.getScore(), s.getFeedback(), s.getSubmittedAt(), s.getReviewedAt());
    }

    private AuthorSummary author(User u) {
        return AuthorSummary.from(u, reputation.levelOf(u.getReputation()));
    }

    private static ApiException overlap() {
        return ApiException.conflict("CHALLENGE_OVERLAP", "Un autre défi a lieu sur cette période");
    }

    private static ApiException notFound() {
        return ApiException.notFound("CHALLENGE_NOT_FOUND", "Défi introuvable");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
