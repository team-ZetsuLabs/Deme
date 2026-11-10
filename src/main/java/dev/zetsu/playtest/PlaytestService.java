package dev.zetsu.playtest;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationDtos.NotificationTarget;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.playtest.PlaytestDtos.Availability;
import dev.zetsu.playtest.PlaytestDtos.MyParticipation;
import dev.zetsu.playtest.PlaytestDtos.MyPlaytestEntry;
import dev.zetsu.playtest.PlaytestDtos.ParticipationView;
import dev.zetsu.playtest.PlaytestDtos.PlaytestDetail;
import dev.zetsu.playtest.PlaytestDtos.PlaytestRequest;
import dev.zetsu.playtest.PlaytestDtos.PlaytestSummary;
import dev.zetsu.playtest.PlaytestDtos.Progress;
import dev.zetsu.playtest.PlaytestEvents.Action;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagRepository;
import dev.zetsu.user.AvatarStorage;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Tests fermés Google Play, côté membre : campagnes (TST-1), participation et suivi des 14 jours (TST-2, TST-3).
 * Zetsu organise l'entraide mais ne vérifie rien chez Google : les compteurs sont des déclarations.
 */
@Service
public class PlaytestService {

    private static final Logger log = LoggerFactory.getLogger(PlaytestService.class);

    private final TestCampaignRepository campaigns;
    private final TestParticipationRepository participations;
    private final PlaytestEvents events;
    private final UserRepository users;
    private final TagRepository tags;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;
    private final NotificationService notifications;
    private final AvatarStorage images;
    private final PlaytestClock clock;

    public PlaytestService(TestCampaignRepository campaigns, TestParticipationRepository participations,
                           PlaytestEvents events, UserRepository users, TagRepository tags, MarkdownRenderer markdown,
                           ReputationService reputation, NotificationService notifications, AvatarStorage images,
                           PlaytestClock clock) {
        this.campaigns = campaigns;
        this.participations = participations;
        this.events = events;
        this.users = users;
        this.tags = tags;
        this.markdown = markdown;
        this.reputation = reputation;
        this.notifications = notifications;
        this.images = images;
        this.clock = clock;
    }

    // ---------------------------------------------------------------- campagnes

    /** Liste publique : actives par défaut ; COMPLETED pour les campagnes terminées. */
    @Transactional(readOnly = true)
    public PageResponse<PlaytestSummary> list(CampaignStatus status, Availability availability, int page, int size) {
        if (status != null && status != CampaignStatus.ACTIVE && status != CampaignStatus.COMPLETED) {
            throw ApiException.badRequest("INVALID_STATUS", "Seules les campagnes actives ou terminées sont listées");
        }
        List<CampaignStatus> statuses = List.of(status == null ? CampaignStatus.ACTIVE : status);
        Page<TestCampaign> result = campaigns.search(statuses, availability == Availability.OPEN,
                availability == Availability.FULL, ParticipationStatus.TAKING_A_SPOT, Paging.of(page, size));
        return new PageResponse<>(summaries(result.getContent()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<PlaytestSummary> mine(int page, int size, ZetsuPrincipal me) {
        Page<TestCampaign> result = campaigns.findMine(me.id(), Paging.of(page, size));
        return new PageResponse<>(summaries(result.getContent()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PlaytestDetail get(Long id, ZetsuPrincipal me) {
        return detail(loadVisible(id, me), me);
    }

    /** TST-1 : toujours créée en brouillon, à envoyer ensuite. */
    @Transactional
    public PlaytestDetail create(PlaytestRequest req, ZetsuPrincipal me) {
        Instant now = clock.now();
        TestCampaign c = new TestCampaign(users.getReferenceById(me.id()), now);
        apply(c, req, now);
        campaigns.saveAndFlush(c);
        events.log(c.getId(), null, me.id(), Action.CREATED, null, now);
        return detail(load(c.getId()), me);
    }

    @Transactional
    public PlaytestDetail edit(Long id, PlaytestRequest req, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        if (c.getStatus() != CampaignStatus.DRAFT && c.getStatus() != CampaignStatus.REJECTED) {
            throw ApiException.conflict("PLAYTEST_NOT_EDITABLE",
                    "Seule une campagne en brouillon ou refusée se modifie");
        }
        Instant now = clock.now();
        apply(c, req, now);
        events.log(c.getId(), null, me.id(), Action.EDITED, null, now);
        return detail(c, me);
    }

    /**
     * Envoi en validation. Un porteur de niveau Membre (50 points) ou plus publie tout de suite ; les nouveaux
     * passent par l'équipe.
     */
    @Transactional
    public PlaytestDetail submit(Long id, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        if (c.getStatus() != CampaignStatus.DRAFT) {
            throw ApiException.conflict("PLAYTEST_NOT_DRAFT", "Seul un brouillon s'envoie en validation");
        }
        requirePackageFree(c);
        Instant now = clock.now();
        User owner = users.findById(me.id()).orElseThrow();
        if (reputation.levelOf(owner.getReputation()).atLeast(PlaytestRules.TRUSTED_LEVEL)) {
            c.setStatus(CampaignStatus.ACTIVE, now);
            events.log(c.getId(), null, me.id(), Action.AUTO_APPROVED, null, now);
            campaigns.flush();
            announce(c);
        } else {
            c.setStatus(CampaignStatus.PENDING_REVIEW, now);
            events.log(c.getId(), null, me.id(), Action.SUBMITTED, null, now);
        }
        return detail(c, me);
    }

    /** Clôture par le porteur : plus de nouvelles participations ; celles en cours vont au bout de leur décompte. */
    @Transactional
    public PlaytestDetail close(Long id, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        if (c.getStatus() != CampaignStatus.ACTIVE && c.getStatus() != CampaignStatus.SUSPENDED) {
            throw ApiException.conflict("PLAYTEST_NOT_ACTIVE", "Seule une campagne active ou suspendue se clôture");
        }
        Instant now = clock.now();
        c.setStatus(CampaignStatus.COMPLETED, now);
        events.log(c.getId(), null, me.id(), Action.CLOSED, null, now);
        return detail(c, me);
    }

    /** Icône de l'application : mêmes contrôles qu'une photo de profil. L'ancienne est supprimée. */
    @Transactional
    public PlaytestDetail updateIcon(Long id, MultipartFile file, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        if (c.getStatus() == CampaignStatus.COMPLETED) {
            throw ApiException.conflict("PLAYTEST_COMPLETED", "Cette campagne est terminée");
        }
        String oldRef = images.iconRefOf(c.getIconUrl());
        AvatarStorage.Stored stored = images.storeIcon(file, c.getId());
        c.setIconUrl(stored.url(), clock.now());
        if (oldRef != null) {
            try {
                images.delete(oldRef);
            } catch (RuntimeException e) {
                log.warn("Ancienne icône de la campagne {} non supprimée : {}", c.getId(), e.getMessage());
            }
        }
        return detail(c, me);
    }

    public record Icon(Resource file, MediaType type) {
    }

    /** Icône gardée sur le disque (sans Cloudinary) : seulement le fichier de la campagne, rien d'autre. */
    @Transactional(readOnly = true)
    public Icon icon(Long id, String file) {
        TestCampaign c = load(id);
        if (c.getIconUrl() == null || !c.getIconUrl().endsWith("/icon/" + file) || !images.isStoredName(file)) {
            throw ApiException.notFound("ICON_NOT_FOUND", "Icône introuvable");
        }
        Resource resource = images.load(file);
        if (!resource.exists()) {
            throw ApiException.notFound("ICON_NOT_FOUND", "Icône introuvable");
        }
        return new Icon(resource, images.mediaType(file));
    }

    // ---------------------------------------------------------------- participations (côté testeur)

    /**
     * TST-2 : rejoindre prend une place tout de suite. Le contrôle des places et l'insertion se font sous verrou de
     * la campagne. Une place libérée par un départ est reprise : le nouveau testeur repart de zéro.
     */
    @Transactional
    public PlaytestDetail join(Long id, ZetsuPrincipal me) {
        TestCampaign c = campaigns.findForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("PLAYTEST_NOT_FOUND", "Campagne introuvable"));
        if (!visibleTo(c, me)) {
            throw ApiException.notFound("PLAYTEST_NOT_FOUND", "Campagne introuvable");
        }
        if (isOwner(c, me)) {
            throw ApiException.forbidden("CANNOT_JOIN_OWN", "Vous ne pouvez pas tester votre propre application");
        }
        if (c.getStatus() != CampaignStatus.ACTIVE || c.isHidden()) {
            throw ApiException.conflict("PLAYTEST_NOT_ACTIVE", "Cette campagne n'accepte pas de testeurs");
        }
        if (participations.findByCampaignIdAndTesterId(c.getId(), me.id()).isPresent()) {
            throw ApiException.conflict("ALREADY_JOINED", "Vous avez déjà rejoint cette campagne");
        }
        long taken = participations.countByCampaignIdAndStatusIn(c.getId(), ParticipationStatus.TAKING_A_SPOT);
        if (taken >= c.getTestersTarget()) {
            throw ApiException.conflict("CAMPAIGN_FULL", "Toutes les places sont prises");
        }
        Instant now = clock.now();
        Long replaces = participations.freedSpots(c.getId(), PageRequest.of(0, 1)).stream().findFirst()
                .map(TestParticipation::getId).orElse(null);
        TestParticipation p = participations.saveAndFlush(
                new TestParticipation(c, users.getReferenceById(me.id()), replaces, now));
        events.log(c.getId(), p.getId(), me.id(), replaces == null ? Action.JOINED : Action.REPLACED, null, now);
        Long ownerId = c.getOwner().getId();
        if (replaces == null) {
            notifications.notify(ownerId, NotificationType.PLAYTEST_JOINED, me.id(), target(c), "JOINED");
        } else {
            notifications.notify(ownerId, NotificationType.PLAYTEST_TESTER_REPLACED, me.id(), target(c), null);
        }
        if (taken + 1 >= c.getTestersTarget()) {
            notifications.notify(ownerId, NotificationType.PLAYTEST_CAMPAIGN_FULL, null, target(c), null);
        }
        return detail(c, me);
    }

    /** Déclaration d'installation : le décompte des jours commence. */
    @Transactional
    public PlaytestDetail confirm(Long id, String googleEmail, ZetsuPrincipal me) {
        TestParticipation p = mine(id, me);
        if (p.getStatus() != ParticipationStatus.JOINED) {
            throw ApiException.conflict("PARTICIPATION_NOT_JOINED", "L'installation est déjà déclarée");
        }
        Instant now = clock.now();
        p.confirm(googleEmail == null || googleEmail.isBlank() ? null : googleEmail.trim(), now);
        TestCampaign c = p.getCampaign();
        events.log(c.getId(), p.getId(), me.id(), Action.CONFIRMED, null, now);
        notifications.notify(c.getOwner().getId(), NotificationType.PLAYTEST_JOINED, me.id(), target(c), "CONFIRMED");
        return detail(c, me);
    }

    /** « Toujours inscrit », une fois par jour (UTC). */
    @Transactional
    public PlaytestDetail checkIn(Long id, ZetsuPrincipal me) {
        TestParticipation p = mine(id, me);
        if (!p.getStatus().counting()) {
            throw ApiException.conflict("PARTICIPATION_NOT_RUNNING", "Aucun décompte en cours sur cette campagne");
        }
        Instant now = clock.now();
        if (!events.checkIn(p.getId(), now)) {
            throw ApiException.conflict("ALREADY_CHECKED_IN", "Déjà fait aujourd'hui");
        }
        p.checkIn(now);
        return detail(p.getCampaign(), me);
    }

    @Transactional
    public PlaytestDetail withdraw(Long id, String reason, ZetsuPrincipal me) {
        TestParticipation p = mine(id, me);
        if (!p.getStatus().running()) {
            throw ApiException.conflict("PARTICIPATION_NOT_RUNNING", "Cette participation est déjà terminée");
        }
        Instant now = clock.now();
        String why = reason == null || reason.isBlank() ? null : reason.trim();
        p.stop(ParticipationStatus.DROPPED, why, now);
        TestCampaign c = p.getCampaign();
        events.log(c.getId(), p.getId(), me.id(), Action.WITHDRAWN, why, now);
        notifications.notify(c.getOwner().getId(), NotificationType.PLAYTEST_TESTER_LEFT, me.id(), target(c),
                "DROPPED");
        return detail(c, me);
    }

    @Transactional(readOnly = true)
    public PageResponse<MyPlaytestEntry> myParticipations(int page, int size, ZetsuPrincipal me) {
        Page<TestParticipation> result = participations.findMine(me.id(), Paging.of(page, size));
        List<TestCampaign> list = result.getContent().stream().map(TestParticipation::getCampaign).toList();
        Map<Long, PlaytestSummary> byId = new HashMap<>();
        for (PlaytestSummary s : summaries(list)) {
            byId.put(s.id(), s);
        }
        Instant now = clock.now();
        List<MyPlaytestEntry> items = result.getContent().stream()
                .map(p -> new MyPlaytestEntry(byId.get(p.getCampaign().getId()), myView(p, now))).toList();
        return new PageResponse<>(items, page, size, result.getTotalElements());
    }

    // ---------------------------------------------------------------- participations (côté porteur)

    @Transactional(readOnly = true)
    public List<ParticipationView> participations(Long id, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        return participationViews(c);
    }

    /** Le porteur a vu le testeur dans la liste de la Play Console. */
    @Transactional
    public List<ParticipationView> verify(Long id, Long participationId, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        TestParticipation p = participationOf(c, participationId);
        if (p.getStatus() != ParticipationStatus.CONFIRMED) {
            throw ApiException.conflict("PARTICIPATION_NOT_CONFIRMED",
                    "Seul un testeur qui a déclaré l'installation se vérifie");
        }
        Instant now = clock.now();
        p.verify(me.id(), now);
        events.log(c.getId(), p.getId(), me.id(), Action.VERIFIED, null, now);
        return participationViews(c);
    }

    @Transactional
    public List<ParticipationView> removeByOwner(Long id, Long participationId, String reason, ZetsuPrincipal me) {
        TestCampaign c = loadOwned(id, me);
        remove(c, participationOf(c, participationId), reason, me.id(), false);
        return participationViews(c);
    }

    /** Retrait d'un testeur par le porteur ou par l'équipe ; le motif est montré au testeur. */
    void remove(TestCampaign c, TestParticipation p, String reason, Long actorId, boolean byTeam) {
        if (!p.getStatus().running()) {
            throw ApiException.conflict("PARTICIPATION_NOT_RUNNING", "Cette participation est déjà terminée");
        }
        Instant now = clock.now();
        p.stop(ParticipationStatus.REMOVED, reason.trim(), now);
        events.log(c.getId(), p.getId(), actorId, Action.REMOVED, reason.trim(), now);
        notifications.notify(p.getTester().getId(), NotificationType.PLAYTEST_REMOVED, actorId, target(c), null);
        if (byTeam) {
            notifications.notify(c.getOwner().getId(), NotificationType.PLAYTEST_TESTER_LEFT, actorId, target(c),
                    "REMOVED");
        }
    }

    // ---------------------------------------------------------------- outils partagés avec le back office

    /** PLAYTEST_NEW_CAMPAIGN : membres qui ont une technologie mobile dans leur stack. */
    void announce(TestCampaign c) {
        List<Long> tagIds = tags.findByNameIn(PlaytestRules.MOBILE_TAGS).stream().map(Tag::getId).toList();
        notifications.notifyStackMatch(NotificationType.PLAYTEST_NEW_CAMPAIGN, c.getOwner().getId(),
                c.getOwner().getId(), tagIds, target(c));
    }

    void requirePackageFree(TestCampaign c) {
        if (campaigns.packageRunningElsewhere(c.getPackageName(), c.getId())) {
            throw ApiException.conflict("PACKAGE_ALREADY_RUNNING",
                    "Une campagne est déjà en cours pour cette application");
        }
    }

    TestCampaign load(Long id) {
        return campaigns.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("PLAYTEST_NOT_FOUND", "Campagne introuvable"));
    }

    private TestCampaign loadVisible(Long id, ZetsuPrincipal me) {
        TestCampaign c = load(id);
        if (!visibleTo(c, me)) {
            throw ApiException.notFound("PLAYTEST_NOT_FOUND", "Campagne introuvable");
        }
        return c;
    }

    /**
     * Visible de tous : active ou terminée, et pas masquée. Toujours visible du porteur, de l'équipe et de ceux qui
     * y participent (une campagne suspendue continue leur décompte). 404 pour les autres.
     */
    private boolean visibleTo(TestCampaign c, ZetsuPrincipal me) {
        boolean listed = c.getStatus() == CampaignStatus.ACTIVE || c.getStatus() == CampaignStatus.COMPLETED;
        if (listed && !c.isHidden()) {
            return true;
        }
        return me != null && (isOwner(c, me) || me.staff()
                || participations.findByCampaignIdAndTesterId(c.getId(), me.id()).isPresent());
    }

    private TestCampaign loadOwned(Long id, ZetsuPrincipal me) {
        TestCampaign c = load(id);
        if (!isOwner(c, me)) {
            if (!visibleTo(c, me)) {
                throw ApiException.notFound("PLAYTEST_NOT_FOUND", "Campagne introuvable");
            }
            throw ApiException.forbidden("NOT_PLAYTEST_OWNER", "Seul le porteur de la campagne peut faire cela");
        }
        return c;
    }

    private TestParticipation mine(Long campaignId, ZetsuPrincipal me) {
        return participations.findByCampaignIdAndTesterId(campaignId, me.id())
                .orElseThrow(() -> ApiException.notFound("PARTICIPATION_NOT_FOUND",
                        "Vous ne participez pas à cette campagne"));
    }

    TestParticipation participationOf(TestCampaign c, Long participationId) {
        return participations.findById(participationId)
                .filter(p -> p.getCampaign().getId().equals(c.getId()))
                .orElseThrow(() -> ApiException.notFound("PARTICIPATION_NOT_FOUND", "Participation introuvable"));
    }

    static boolean isOwner(TestCampaign c, ZetsuPrincipal me) {
        return me != null && c.getOwner().getId().equals(me.id());
    }

    static NotificationTarget target(TestCampaign c) {
        return NotificationService.target(NotificationTargetType.PLAYTEST, c.getId(), c.getAppName());
    }

    AuthorSummary author(User u) {
        return AuthorSummary.from(u, reputation.levelOf(u.getReputation()));
    }

    private void apply(TestCampaign c, PlaytestRequest req, Instant now) {
        String instructions = req.instructions() == null || req.instructions().isBlank() ? null
                : req.instructions().trim();
        c.edit(req.appName().trim(), req.packageName().trim(), req.description(),
                markdown.toSafeHtml(req.description()), req.optInUrl().trim(),
                req.testersTarget() == null ? 14 : req.testersTarget(), req.desiredStart(), instructions, now);
    }

    // ---------------------------------------------------------------- vues

    List<PlaytestSummary> summaries(Collection<TestCampaign> list) {
        if (list.isEmpty()) {
            return List.of();
        }
        Map<Long, List<TestParticipation>> byCampaign = new HashMap<>();
        for (TestCampaign c : list) {
            byCampaign.put(c.getId(), new ArrayList<>());
        }
        for (TestParticipation p : participations.findAllOfCampaigns(byCampaign.keySet())) {
            byCampaign.get(p.getCampaign().getId()).add(p);
        }
        Instant now = clock.now();
        return list.stream().map(c -> summary(c, byCampaign.get(c.getId()), now)).toList();
    }

    PlaytestSummary summary(TestCampaign c, List<TestParticipation> all, Instant now) {
        return new PlaytestSummary(c.getId(), c.getAppName(), c.getPackageName(), c.getPlatform(), c.getIconUrl(),
                author(c.getOwner()), c.getStatus(), c.getTestersTarget(), c.getRequiredDays(), spotsLeft(c, all),
                progress(c, all, now), c.getCreatedAt(), c.getStartedAt());
    }

    PlaytestDetail detail(TestCampaign c, ZetsuPrincipal me) {
        List<TestParticipation> all = participations.findAllOf(c.getId());
        Instant now = clock.now();
        Optional<TestParticipation> mine = me == null ? Optional.empty()
                : all.stream().filter(p -> p.getTester().getId().equals(me.id())).findFirst();
        boolean owner = isOwner(c, me);
        boolean staff = me != null && me.staff();
        boolean tester = mine.map(p -> p.getStatus().running() || p.getStatus() == ParticipationStatus.COMPLETED)
                .orElse(false);
        boolean insider = owner || staff || tester;
        int spots = spotsLeft(c, all);
        boolean canJoin = me != null && !owner && mine.isEmpty() && c.getStatus() == CampaignStatus.ACTIVE
                && !c.isHidden() && spots > 0;
        return new PlaytestDetail(c.getId(), c.getAppName(), c.getPackageName(), c.getPlatform(), c.getIconUrl(),
                c.getDescriptionMarkdown(), c.getDescriptionHtml(), insider ? c.getOptInUrl() : null,
                insider ? c.getInstructions() : null, author(c.getOwner()), c.getStatus(),
                owner || staff ? c.getReviewNote() : null, c.getTestersTarget(), c.getRequiredDays(), spots,
                progress(c, all, now), estimatedEnd(all, spots), c.getDesiredStart(),
                mine.map(p -> myView(p, now)).orElse(null),
                owner && (c.getStatus() == CampaignStatus.DRAFT || c.getStatus() == CampaignStatus.REJECTED),
                owner && c.getStatus() == CampaignStatus.DRAFT,
                owner && (c.getStatus() == CampaignStatus.ACTIVE || c.getStatus() == CampaignStatus.SUSPENDED),
                canJoin, c.getCreatedAt(), c.getUpdatedAt(), c.getStartedAt(), c.getCompletedAt());
    }

    List<ParticipationView> participationViews(TestCampaign c) {
        Instant now = clock.now();
        return participations.findAllOf(c.getId()).stream().map(p -> new ParticipationView(p.getId(),
                author(p.getTester()), p.getStatus(), p.proofLevel(), p.daysDone(now), p.getJoinedAt(),
                p.getConfirmedAt(), p.getVerifiedAt(), p.getEndsAt(), p.getLastCheckInAt(), p.needsAttention(now),
                p.getGoogleEmail(), p.getCompletedAt(), p.getDroppedAt(), p.getDropReason(), p.getReplacesId()))
                .toList();
    }

    private MyParticipation myView(TestParticipation p, Instant now) {
        Instant confirmBefore = p.getStatus() == ParticipationStatus.JOINED
                ? p.getJoinedAt().plus(PlaytestRules.INSTALL_DEADLINE) : null;
        boolean checkedIn = p.getStatus().counting() && events.checkedIn(p.getId(), now);
        return new MyParticipation(p.getId(), p.getStatus(), p.proofLevel(), p.daysDone(now),
                p.getCampaign().getRequiredDays(), p.getJoinedAt(), confirmBefore, p.getConfirmedAt(),
                p.getVerifiedAt(), p.getEndsAt(), p.getLastCheckInAt(), checkedIn, p.needsAttention(now),
                p.getGoogleEmail(), p.getCompletedAt(), p.getDroppedAt(), p.getDropReason());
    }

    static int spotsLeft(TestCampaign c, List<TestParticipation> all) {
        long taken = all.stream().filter(p -> ParticipationStatus.TAKING_A_SPOT.contains(p.getStatus())).count();
        return (int) Math.max(0, c.getTestersTarget() - taken);
    }

    static Progress progress(TestCampaign c, List<TestParticipation> all, Instant now) {
        Map<ParticipationStatus, Integer> counts = new EnumMap<>(ParticipationStatus.class);
        long days = 0;
        for (TestParticipation p : all) {
            counts.merge(p.getStatus(), 1, Integer::sum);
            if (p.getStatus().counting() || p.getStatus() == ParticipationStatus.COMPLETED) {
                days += p.daysDone(now);
            }
        }
        long goal = (long) c.getTestersTarget() * c.getRequiredDays();
        int percent = goal == 0 ? 0 : (int) Math.min(100, days * 100 / goal);
        return new Progress(percent, counts.getOrDefault(ParticipationStatus.COMPLETED, 0),
                counts.getOrDefault(ParticipationStatus.VERIFIED, 0),
                counts.getOrDefault(ParticipationStatus.CONFIRMED, 0),
                counts.getOrDefault(ParticipationStatus.JOINED, 0));
    }

    /** Toutes les places prises par des installations déclarées : fin du dernier décompte. Null sinon. */
    private static Instant estimatedEnd(List<TestParticipation> all, int spots) {
        if (spots > 0 || all.stream().anyMatch(p -> p.getStatus() == ParticipationStatus.JOINED)) {
            return null;
        }
        return all.stream().filter(p -> p.getStatus().counting()).map(TestParticipation::getEndsAt)
                .max(Instant::compareTo).orElse(null);
    }
}
