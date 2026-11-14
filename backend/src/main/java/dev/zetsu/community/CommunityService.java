package dev.zetsu.community;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.community.CommunityDtos.AdminCommunity;
import dev.zetsu.community.CommunityDtos.CommunityDetail;
import dev.zetsu.community.CommunityDtos.CommunityRequest;
import dev.zetsu.community.CommunityDtos.CommunitySummary;
import dev.zetsu.community.CommunityDtos.MembershipResult;
import dev.zetsu.reputation.Level;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * COM-1 (idée de l'équipe, hors cahier) : communautés par pays ou par technologie. Une question appartient à une
 * communauté par son pays ou son étiquette : rien à choisir en la posant. L'équipe crée, modifie, ferme et nomme
 * les Référents ; les membres rejoignent et quittent d'un clic, à tous les niveaux.
 */
@Service
public class CommunityService {

    private static final int TOP_MEMBERS = 5;

    private final CommunityRepository communities;
    private final CommunitySearch search;
    private final UserRepository users;
    private final TagService tags;
    private final ReputationService reputation;

    public CommunityService(CommunityRepository communities, CommunitySearch search, UserRepository users,
                            TagService tags, ReputationService reputation) {
        this.communities = communities;
        this.search = search;
        this.users = users;
        this.tags = tags;
        this.reputation = reputation;
    }

    @Transactional(readOnly = true)
    public PageResponse<CommunitySummary> list(CommunityKind kind, String text, int page, int size, ZetsuPrincipal me) {
        Paging.of(page, size);
        var result = search.search(CommunityStatus.OPEN, kind, text, slugify(text), viewer(me), page, size);
        return new PageResponse<>(result.rows().stream().map(CommunityService::toSummary).toList(), page, size,
                result.total());
    }

    @Transactional(readOnly = true)
    public CommunityDetail get(String slug, ZetsuPrincipal me) {
        Community c = loadOpen(slug);
        CommunitySearch.Row row = row(c, viewer(me));
        return new CommunityDetail(c.getSlug(), c.getName(), c.getKind(), c.getCountryCode(), tagName(c),
                c.getDescription(), row.memberCount(), row.questionCount(), row.joined(), List.copyOf(c.getRules()),
                authors(search.referentIds(c.getId())), authors(search.topMemberIds(c, TOP_MEMBERS)), c.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<CommunitySummary> mine(ZetsuPrincipal me) {
        return search.joinedBy(me.id()).stream().map(CommunityService::toSummary).toList();
    }

    /** Rejoindre deux fois ne change rien : la réponse est la même. */
    @Transactional
    public MembershipResult join(String slug, ZetsuPrincipal me) {
        Community c = loadOpen(slug);
        search.join(c.getId(), me.id());
        return new MembershipResult(true, search.memberCount(c.getId()));
    }

    @Transactional
    public MembershipResult leave(String slug, ZetsuPrincipal me) {
        Community c = loadOpen(slug);
        search.leave(c.getId(), me.id());
        return new MembershipResult(false, search.memberCount(c.getId()));
    }

    // --- Back office ---

    @Transactional(readOnly = true)
    public PageResponse<AdminCommunity> adminList(CommunityStatus status, CommunityKind kind, String text, int page,
                                                  int size) {
        Paging.of(page, size);
        var result = search.search(status, kind, text, slugify(text), null, page, size);
        Map<Long, Community> byId = result.rows().isEmpty() ? Map.of()
                : communities.findAllDetailed(result.rows().stream().map(CommunitySearch.Row::id).toList()).stream()
                .collect(Collectors.toMap(Community::getId, Function.identity()));
        List<AdminCommunity> items = result.rows().stream()
                .map(r -> toAdmin(byId.get(r.id()), r)).toList();
        return new PageResponse<>(items, page, size, result.total());
    }

    @Transactional
    public AdminCommunity create(CommunityRequest req, ZetsuPrincipal me) {
        Scope scope = scope(req);
        Community c = create(req.name().trim(), scope, req.description().trim(), rules(req.rules()), me.id());
        return toAdmin(c, row(c, null));
    }

    /** Création commune à l'équipe et à une proposition acceptée (COM-2). L'adresse vient du nom. */
    Community create(String name, Scope scope, String description, List<String> rules, Long createdBy) {
        String slug = slugify(name);
        if (slug.isEmpty()) {
            throw ApiException.invalidField("name", "Le nom doit contenir au moins une lettre ou un chiffre");
        }
        ensureAvailable(slug, name, scope, null);
        Community c = new Community(slug, createdBy);
        c.setName(name);
        c.setScope(scope.kind(), scope.countryCode(), scope.tagName() == null ? null : resolveTag(scope.tagName()));
        c.setDescription(description);
        c.setRules(rules);
        return save(c);
    }

    /** L'adresse ne change pas avec le nom : les liens partagés restent bons. */
    @Transactional
    public AdminCommunity update(String slug, CommunityRequest req) {
        Community c = load(slug);
        Scope scope = scope(req);
        String name = req.name().trim();
        ensureAvailable(c.getSlug(), name, scope, c.getId());
        c.setName(name);
        c.setScope(scope.kind(), scope.countryCode(), scope.tagName() == null ? null : resolveTag(scope.tagName()));
        c.setDescription(req.description().trim());
        c.setRules(rules(req.rules()));
        c.touch();
        save(c);
        return toAdmin(c, row(c, null));
    }

    /** Une communauté fermée disparaît des listes ; ses membres et ses Référents sont gardés pour la rouvrir. */
    @Transactional
    public AdminCommunity setStatus(String slug, CommunityStatus status) {
        Community c = load(slug);
        if (c.getStatus() != status) {
            c.setStatus(status);
        }
        return toAdmin(c, row(c, null));
    }

    /** Un Référent nommé doit avoir le niveau Référent (section 8) ; il devient aussi membre de la communauté. */
    @Transactional
    public AdminCommunity setReferents(String slug, List<String> usernames) {
        Community c = load(slug);
        List<Long> ids = new ArrayList<>();
        for (String username : new LinkedHashSet<>(usernames.stream().filter(Objects::nonNull).map(String::trim)
                .filter(u -> !u.isEmpty()).toList())) {
            User u = users.findByUsernameIgnoreCase(username).filter(x -> !x.isDeleted())
                    .orElseThrow(() -> ApiException.notFound("USER_NOT_FOUND", "Membre introuvable : " + username));
            if (!reputation.levelOf(u.getReputation()).atLeast(Level.REFERENT)) {
                throw ApiException.badRequest("NOT_A_REFERENT", username + " n'a pas encore le niveau Référent");
            }
            if (!ids.contains(u.getId())) {
                ids.add(u.getId());
            }
        }
        search.replaceReferents(c.getId(), ids);
        ids.forEach(id -> search.join(c.getId(), id));
        return toAdmin(c, row(c, null));
    }

    /** Proposeur d'une communauté acceptée (COM-2) : premier Référent et premier membre. */
    void addFounder(Community c, Long userId) {
        search.replaceReferents(c.getId(), List.of(userId));
        search.join(c.getId(), userId);
    }

    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        search.forget(event.userId());
    }

    // --- Règles communes ---

    /** Type de la communauté avec son pays ou son étiquette (normalisée, pas encore créée). */
    record Scope(CommunityKind kind, String countryCode, String tagName) {
    }

    static Scope scope(CommunityRequest req) {
        if (req.kind() == CommunityKind.COUNTRY) {
            if (req.countryCode() == null || req.countryCode().isBlank()) {
                throw ApiException.invalidField("countryCode", "Obligatoire pour une communauté de pays");
            }
            return new Scope(CommunityKind.COUNTRY, req.countryCode(), null);
        }
        String tag = TagService.normalize(req.tag());
        if (tag.isEmpty()) {
            throw ApiException.invalidField("tag", "Obligatoire pour une communauté de techno");
        }
        if (!TagService.isValidName(tag)) {
            throw ApiException.invalidField("tag", "Étiquette invalide : lettres minuscules, chiffres, . + # -");
        }
        return new Scope(CommunityKind.TECH, null, tag);
    }

    static List<String> rules(List<String> raw) {
        return raw == null ? List.of() : raw.stream().map(String::trim).toList();
    }

    void ensureAvailable(String slug, String name, Scope scope, Long excludeId) {
        if (search.taken(slug, name, scope.countryCode(), scope.tagName(), excludeId)) {
            throw exists();
        }
    }

    static ApiException exists() {
        return ApiException.conflict("COMMUNITY_EXISTS",
                "Une communauté existe déjà avec ce nom, ce pays ou cette étiquette");
    }

    /**
     * Adresse sans accent ni espace : « Sénégal » donne « senegal », « Mobile money » donne « mobile-money ».
     * Vide si le texte n'a ni lettre ni chiffre.
     */
    static String slugify(String text) {
        if (text == null) {
            return "";
        }
        String s = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase()
                .replace("+", "plus").replace("#", "sharp")
                .replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return s.length() > 40 ? s.substring(0, 40).replaceAll("-+$", "") : s;
    }

    private Tag resolveTag(String name) {
        return tags.resolve(List.of(name), 1, 1).iterator().next();
    }

    private Community save(Community c) {
        try {
            return communities.saveAndFlush(c);
        } catch (DataIntegrityViolationException e) {
            throw exists();
        }
    }

    private Community load(String slug) {
        return communities.findBySlug(slug).orElseThrow(CommunityService::notFound);
    }

    /** Une communauté fermée n'existe plus pour les membres. */
    private Community loadOpen(String slug) {
        Community c = load(slug);
        if (c.getStatus() != CommunityStatus.OPEN) {
            throw notFound();
        }
        return c;
    }

    private CommunitySearch.Row row(Community c, Long viewerId) {
        return search.rows(List.of(c.getId()), viewerId).get(c.getId());
    }

    /** Dans l'ordre des identifiants donnés. */
    private List<AuthorSummary> authors(List<Long> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, User> byId = users.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        return ids.stream().map(byId::get).filter(Objects::nonNull)
                .map(u -> AuthorSummary.from(u, reputation.levelOf(u.getReputation()))).toList();
    }

    private AdminCommunity toAdmin(Community c, CommunitySearch.Row r) {
        return new AdminCommunity(c.getSlug(), c.getName(), c.getKind(), c.getCountryCode(), tagName(c),
                c.getDescription(), List.copyOf(c.getRules()), c.getStatus(), r.memberCount(), r.questionCount(),
                authors(search.referentIds(c.getId())), c.getCreatedAt(), c.getUpdatedAt());
    }

    private static CommunitySummary toSummary(CommunitySearch.Row r) {
        return new CommunitySummary(r.slug(), r.name(), r.kind(), r.countryCode(), r.tag(), r.description(),
                r.memberCount(), r.questionCount(), r.joined());
    }

    private static String tagName(Community c) {
        return c.getTag() == null ? null : c.getTag().getName();
    }

    private static Long viewer(ZetsuPrincipal me) {
        return me == null ? null : me.id();
    }

    static ApiException notFound() {
        return ApiException.notFound("COMMUNITY_NOT_FOUND", "Communauté introuvable");
    }
}
