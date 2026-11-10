package dev.zetsu.playtest;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.playtest.PlaytestDtos.AdminPlaytestSummary;
import dev.zetsu.playtest.PlaytestDtos.EventView;
import dev.zetsu.playtest.PlaytestDtos.ParticipationView;
import dev.zetsu.playtest.PlaytestDtos.PlaytestDetail;
import dev.zetsu.playtest.PlaytestDtos.PlaytestSummary;
import dev.zetsu.playtest.PlaytestDtos.Problem;
import dev.zetsu.playtest.PlaytestDtos.ReviewDecision;
import dev.zetsu.playtest.PlaytestDtos.Stats;
import dev.zetsu.playtest.PlaytestEvents.Action;
import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Tests fermés, côté équipe (TST-5, TST-6) : validation, suspension, campagnes à surveiller, statistiques. */
@Service
public class PlaytestAdminService {

    private final TestCampaignRepository campaigns;
    private final PlaytestService playtests;
    private final PlaytestEvents events;
    private final NotificationService notifications;
    private final UserRepository users;
    private final NamedParameterJdbcTemplate jdbc;
    private final PlaytestClock clock;

    public PlaytestAdminService(TestCampaignRepository campaigns, PlaytestService playtests, PlaytestEvents events,
                                NotificationService notifications, UserRepository users,
                                NamedParameterJdbcTemplate jdbc, PlaytestClock clock) {
        this.campaigns = campaigns;
        this.playtests = playtests;
        this.events = events;
        this.notifications = notifications;
        this.users = users;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    private record Flags(long id, boolean inactive, boolean stalled) {
    }

    /**
     * Toutes les campagnes sauf les brouillons, celles en attente de validation d'abord. INACTIVE : active, aucune
     * participation depuis 7 jours ; STALLED : plus de 30 % des testeurs en cours « à confirmer » ; REPORTED : masquée.
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminPlaytestSummary> list(CampaignStatus status, Problem problem, int page, int size) {
        Paging.of(page, size);
        Instant now = clock.now();
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("status", status == null ? null : status.name(), java.sql.Types.VARCHAR)
                .addValue("problem", problem == null ? null : problem.name(), java.sql.Types.VARCHAR)
                .addValue("inactiveBefore", Timestamp.from(now.minus(PlaytestRules.INACTIVE_AFTER)))
                .addValue("silentBefore", Timestamp.from(now.minus(PlaytestRules.STAY_REMINDER_AFTER)))
                .addValue("share", PlaytestRules.STALLED_SHARE)
                .addValue("limit", size)
                .addValue("offset", page * size);
        String flagged = """
                with flagged as (
                    select c.id, c.status, c.hidden, c.created_at,
                           c.status = 'ACTIVE' and coalesce((select max(p.joined_at) from test_participations p
                                                             where p.campaign_id = c.id), c.started_at)
                                                   < :inactiveBefore as inactive,
                           coalesce((select count(*) filter (where p.last_check_in_at < :silentBefore)::float
                                            / nullif(count(*), 0)
                                     from test_participations p
                                     where p.campaign_id = c.id and p.status in ('CONFIRMED', 'VERIFIED')), 0)
                               > :share as stalled
                    from test_campaigns c
                    where c.status <> 'DRAFT' and (cast(:status as varchar) is null or c.status = :status)
                )
                """;
        String filter = """
                where cast(:problem as varchar) is null
                   or (:problem = 'INACTIVE' and inactive) or (:problem = 'STALLED' and stalled)
                   or (:problem = 'REPORTED' and hidden)
                """;
        Long total = jdbc.queryForObject(flagged + "select count(*) from flagged " + filter, params, Long.class);
        List<Flags> rows = jdbc.query(flagged + "select id, inactive, stalled from flagged " + filter + """
                order by (status = 'PENDING_REVIEW') desc, created_at desc, id desc limit :limit offset :offset
                """, params, (rs, i) -> new Flags(rs.getLong("id"), rs.getBoolean("inactive"),
                rs.getBoolean("stalled")));
        Map<Long, TestCampaign> byId = campaigns.findAllById(rows.stream().map(Flags::id).toList()).stream()
                .collect(Collectors.toMap(TestCampaign::getId, Function.identity()));
        List<TestCampaign> ordered = rows.stream().map(r -> byId.get(r.id())).filter(Objects::nonNull).toList();
        Map<Long, PlaytestSummary> summaries = playtests.summaries(ordered).stream()
                .collect(Collectors.toMap(PlaytestSummary::id, Function.identity()));
        List<AdminPlaytestSummary> items = rows.stream().filter(r -> byId.containsKey(r.id()))
                .map(r -> {
                    TestCampaign c = byId.get(r.id());
                    return new AdminPlaytestSummary(summaries.get(r.id()), c.isHidden(), r.inactive(), r.stalled(),
                            c.getReviewNote());
                }).toList();
        return new PageResponse<>(items, page, size, total == null ? 0 : total);
    }

    @Transactional
    public PlaytestDetail review(Long id, ReviewDecision decision, String note, ZetsuPrincipal me) {
        TestCampaign c = playtests.load(id);
        if (c.getStatus() != CampaignStatus.PENDING_REVIEW) {
            throw ApiException.conflict("PLAYTEST_NOT_PENDING", "Cette campagne n'attend pas de validation");
        }
        Instant now = clock.now();
        String text = clean(note);
        if (decision == ReviewDecision.REJECT) {
            requireNote(text);
            c.setStatus(CampaignStatus.REJECTED, now);
            c.review(me.id(), text, now);
            events.log(c.getId(), null, me.id(), Action.REJECTED, text, now);
            notifyOwner(c, me, "REJECTED");
        } else {
            playtests.requirePackageFree(c);
            c.setStatus(CampaignStatus.ACTIVE, now);
            c.review(me.id(), text, now);
            events.log(c.getId(), null, me.id(), Action.APPROVED, text, now);
            notifyOwner(c, me, "APPROVED");
            campaigns.flush();
            playtests.announce(c);
        }
        return playtests.detail(c, me);
    }

    @Transactional
    public PlaytestDetail suspend(Long id, String note, ZetsuPrincipal me) {
        TestCampaign c = playtests.load(id);
        if (c.getStatus() != CampaignStatus.ACTIVE) {
            throw ApiException.conflict("PLAYTEST_NOT_ACTIVE", "Seule une campagne active se suspend");
        }
        String text = clean(note);
        requireNote(text);
        Instant now = clock.now();
        c.setStatus(CampaignStatus.SUSPENDED, now);
        c.review(me.id(), text, now);
        events.log(c.getId(), null, me.id(), Action.SUSPENDED, text, now);
        notifyOwner(c, me, "SUSPENDED");
        return playtests.detail(c, me);
    }

    @Transactional
    public PlaytestDetail reactivate(Long id, String note, ZetsuPrincipal me) {
        TestCampaign c = playtests.load(id);
        if (c.getStatus() != CampaignStatus.SUSPENDED) {
            throw ApiException.conflict("PLAYTEST_NOT_SUSPENDED", "Cette campagne n'est pas suspendue");
        }
        Instant now = clock.now();
        String text = clean(note);
        c.setStatus(CampaignStatus.ACTIVE, now);
        c.review(me.id(), text, now);
        events.log(c.getId(), null, me.id(), Action.REACTIVATED, text, now);
        notifyOwner(c, me, "REACTIVATED");
        return playtests.detail(c, me);
    }

    @Transactional(readOnly = true)
    public List<ParticipationView> participations(Long id) {
        return playtests.participationViews(playtests.load(id));
    }

    /** Retrait par l'équipe : le testeur et le porteur sont prévenus. */
    @Transactional
    public List<ParticipationView> remove(Long id, Long participationId, String reason, ZetsuPrincipal me) {
        TestCampaign c = playtests.load(id);
        playtests.remove(c, playtests.participationOf(c, participationId), reason, me.id(), true);
        return playtests.participationViews(c);
    }

    @Transactional(readOnly = true)
    public PageResponse<EventView> events(Long id, int page, int size) {
        Paging.of(page, size);
        TestCampaign c = playtests.load(id);
        List<PlaytestEvents.Row> rows = events.of(c.getId(), size, page * size);
        Map<Long, User> actors = new HashMap<>();
        for (User u : users.findAllById(rows.stream().map(PlaytestEvents.Row::actorId).filter(Objects::nonNull)
                .distinct().toList())) {
            actors.put(u.getId(), u);
        }
        List<EventView> items = rows.stream().map(r -> new EventView(r.id(), r.action(),
                r.actorId() == null || !actors.containsKey(r.actorId()) ? null : playtests.author(actors.get(r.actorId())),
                r.participationId(), r.note(), r.createdAt())).toList();
        return new PageResponse<>(items, page, size, events.count(c.getId()));
    }

    /** Calculé en SQL à la demande : pas de table de statistiques. */
    @Transactional(readOnly = true)
    public Stats stats() {
        return jdbc.queryForObject("""
                select (select count(*) from test_campaigns where status <> 'DRAFT') as campaigns,
                       (select count(*) from test_campaigns where status = 'PENDING_REVIEW') as pending,
                       (select count(*) from test_campaigns where status = 'ACTIVE') as active,
                       (select count(*) from test_campaigns where status = 'COMPLETED') as completed,
                       (select count(*) from test_campaigns c where (select count(*) from test_participations p
                            where p.campaign_id = c.id and p.status = 'COMPLETED') >= c.testers_target) as reached,
                       (select count(distinct owner_id) from test_campaigns where status <> 'DRAFT') as owners,
                       (select count(distinct tester_id) from test_participations) as testers,
                       (select count(*) from test_participations
                            where status in ('JOINED', 'CONFIRMED', 'VERIFIED')) as running,
                       (select count(*) from test_participations where status = 'COMPLETED') as done
                """, new MapSqlParameterSource(), (rs, i) -> new Stats(rs.getLong("campaigns"), rs.getLong("pending"),
                rs.getLong("active"), rs.getLong("completed"), rs.getLong("reached"), rs.getLong("owners"),
                rs.getLong("testers"), rs.getLong("running"), rs.getLong("done")));
    }

    private void notifyOwner(TestCampaign c, ZetsuPrincipal me, String outcome) {
        notifications.notify(c.getOwner().getId(), NotificationType.PLAYTEST_CAMPAIGN_REVIEWED, me.id(),
                PlaytestService.target(c), outcome);
    }

    private static String clean(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }

    private static void requireNote(String note) {
        if (note == null || note.length() < 5) {
            throw ApiException.badRequest("NOTE_REQUIRED", "Le motif est obligatoire (5 caractères au moins)");
        }
    }
}
