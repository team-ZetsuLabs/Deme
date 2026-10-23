package dev.zetsu.mission;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.job.ApplicationRepository;
import dev.zetsu.job.JobDtos.MyApplicationRef;
import dev.zetsu.mission.MissionDtos.Budget;
import dev.zetsu.mission.MissionDtos.MissionDetail;
import dev.zetsu.mission.MissionDtos.MissionRequest;
import dev.zetsu.mission.MissionDtos.MissionSummary;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MissionService {

    private static final int MAX_TECHNOLOGIES = 10;

    private final MissionRepository missions;
    private final MissionSearch search;
    private final ApplicationRepository applications;
    private final UserRepository users;
    private final TagService tags;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;

    public MissionService(MissionRepository missions, MissionSearch search, ApplicationRepository applications,
                          UserRepository users, TagService tags, MarkdownRenderer markdown,
                          ReputationService reputation) {
        this.missions = missions;
        this.search = search;
        this.applications = applications;
        this.users = users;
        this.tags = tags;
        this.markdown = markdown;
        this.reputation = reputation;
    }

    @Transactional(readOnly = true)
    public PageResponse<MissionSummary> list(MissionSearch.Criteria criteria, int page, int size) {
        Paging.of(page, size);
        MissionSearch.Result result = search.search(criteria, page, size);
        if (result.ids().isEmpty()) {
            return new PageResponse<>(List.of(), page, size, result.total());
        }
        Map<Long, Mission> byId = missions.findAllDetailed(result.ids()).stream()
                .collect(Collectors.toMap(Mission::getId, Function.identity()));
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : applications.countByMissions(result.ids())) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        List<MissionSummary> items = result.ids().stream().map(byId::get).filter(m -> m != null)
                .map(m -> toSummary(m, counts.getOrDefault(m.getId(), 0L).intValue()))
                .toList();
        return new PageResponse<>(items, page, size, result.total());
    }

    @Transactional(readOnly = true)
    public MissionDetail get(Long id, ZetsuPrincipal me) {
        return toDetail(load(id), me);
    }

    @Transactional
    public MissionDetail create(MissionRequest req, ZetsuPrincipal me) {
        Mission m = new Mission(users.getReferenceById(me.id()));
        apply(m, req);
        missions.saveAndFlush(m);
        return toDetail(load(m.getId()), me);
    }

    @Transactional
    public MissionDetail update(Long id, MissionRequest req, ZetsuPrincipal me) {
        Mission m = loadOwned(id, me);
        if (m.getStatus() != MissionStatus.OPEN) {
            throw notOpen();
        }
        apply(m, req);
        m.touch();
        missions.saveAndFlush(m);
        return toDetail(m, me);
    }

    @Transactional
    public MissionDetail close(Long id, ZetsuPrincipal me) {
        Mission m = loadOwned(id, me);
        m.close();
        return toDetail(m, me);
    }

    /** AUTH-6 : les missions d'un membre supprimé ne restent pas ouvertes. */
    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        missions.closeAllOf(event.userId());
    }

    public Mission load(Long id) {
        return missions.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("MISSION_NOT_FOUND", "Mission introuvable"));
    }

    public Mission loadOwned(Long id, ZetsuPrincipal me) {
        Mission m = load(id);
        if (!isAuthor(m, me)) {
            throw ApiException.forbidden("NOT_MISSION_AUTHOR", "Seul l'auteur de la mission peut faire cela");
        }
        return m;
    }

    public static boolean isAuthor(Mission m, ZetsuPrincipal me) {
        return me != null && m.getAuthor().getId().equals(me.id());
    }

    public static ApiException notOpen() {
        return ApiException.conflict("MISSION_NOT_OPEN", "Cette mission n'accepte plus de propositions");
    }

    private void apply(Mission m, MissionRequest req) {
        m.setTitle(req.title().trim());
        m.setDescription(req.description(), markdown.toSafeHtml(req.description()));
        m.setKind(req.kind());
        m.setBudget(req.budget().amount(), req.budget().currency());
        m.setDurationDays(req.durationDays());
        m.setTechnologies(tags.resolve(req.technologies(), 0, MAX_TECHNOLOGIES));
        m.setCountryCode(req.countryCode() == null || req.countryCode().isBlank() ? null : req.countryCode().trim());
    }

    private AuthorSummary author(Mission m) {
        User u = m.getAuthor();
        return AuthorSummary.from(u, reputation.levelOf(u.getReputation()));
    }

    private static List<String> names(Mission m) {
        return m.getTechnologies().stream().map(Tag::getName).toList();
    }

    private static Budget budget(Mission m) {
        return new Budget(m.getBudgetAmount(), m.getBudgetCurrency());
    }

    private MissionSummary toSummary(Mission m, int applicationCount) {
        return new MissionSummary(m.getId(), m.getTitle(), m.getKind(), budget(m), m.getDurationDays(), names(m),
                m.getCountryCode(), author(m), m.getStatus(), applicationCount, m.getCreatedAt());
    }

    public MissionDetail toDetail(Mission m, ZetsuPrincipal me) {
        MyApplicationRef mine = me == null ? null : applications.findByMissionIdAndCandidateId(m.getId(), me.id())
                .map(a -> new MyApplicationRef(a.getId(), a.getStatus())).orElse(null);
        int count = applications.countByMissions(List.of(m.getId())).stream()
                .mapToInt(row -> ((Long) row[1]).intValue()).sum();
        return new MissionDetail(m.getId(), m.getTitle(), m.getDescriptionMarkdown(), m.getDescriptionHtml(), m.getKind(),
                budget(m), m.getDurationDays(), names(m), m.getCountryCode(), author(m), m.getStatus(), count, mine,
                isAuthor(m, me) && m.getStatus() != MissionStatus.CLOSED, m.getCreatedAt(), m.getUpdatedAt());
    }
}
