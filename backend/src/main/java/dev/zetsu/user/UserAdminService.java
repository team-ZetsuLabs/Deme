package dev.zetsu.user;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.UserAdminDtos.AdminUser;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Back office des comptes (MOD-4) : rechercher, suspendre, réactiver, changer le rôle. */
@Service
public class UserAdminService {

    private record ModerationCounts(long hidden, long warnings) {
    }

    private final UserRepository users;
    private final ReputationService reputation;
    private final NamedParameterJdbcTemplate jdbc;

    public UserAdminService(UserRepository users, ReputationService reputation, NamedParameterJdbcTemplate jdbc) {
        this.users = users;
        this.reputation = reputation;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUser> list(String q, UserStatus status, Role role, int page, int size) {
        // « _ » est gardé : dans un like il vaut n'importe quel caractère, lui compris (pseudos kofi_mensah).
        String like = q == null || q.isBlank() ? null
                : "%" + q.trim().toLowerCase().replaceAll("[%\\\\]", "") + "%";
        Page<User> result = users.searchForAdmin(like, status, role, Paging.of(page, size));
        Map<Long, ModerationCounts> counts = counts(result.getContent().stream().map(User::getId).toList());
        return PageResponse.of(result, u -> toDto(u, counts.get(u.getId())));
    }

    /**
     * Suspend un compte actif ; ses sessions ouvertes se ferment à la requête suivante (ActiveAccountFilter).
     * Jamais un membre de l'équipe, donc jamais soi-même.
     */
    @Transactional
    public AdminUser suspend(Long id, String reason, ZetsuPrincipal me) {
        User u = load(id);
        if (u.getRole() == Role.MODERATOR || u.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("CANNOT_SUSPEND_STAFF", "Impossible de suspendre un membre de l'équipe");
        }
        if (u.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.conflict("USER_NOT_ACTIVE", "Ce compte n'est pas actif");
        }
        u.suspend(reason.trim());
        return toDto(u);
    }

    @Transactional
    public AdminUser reactivate(Long id) {
        User u = load(id);
        if (u.getStatus() != UserStatus.SUSPENDED) {
            throw ApiException.conflict("USER_NOT_SUSPENDED", "Ce compte n'est pas suspendu");
        }
        u.reactivate();
        return toDto(u);
    }

    @Transactional
    public AdminUser changeRole(Long id, Role role, ZetsuPrincipal me) {
        if (me.role() != Role.ADMIN) {
            throw ApiException.forbidden("FORBIDDEN", "Seul un Administrateur peut changer un rôle");
        }
        if (id.equals(me.id())) {
            throw ApiException.forbidden("CANNOT_CHANGE_OWN_ROLE", "Impossible de changer son propre rôle");
        }
        User u = load(id);
        if (u.getStatus() != UserStatus.ACTIVE) {
            throw ApiException.conflict("USER_NOT_ACTIVE", "Ce compte n'est pas actif");
        }
        u.setRole(role);
        return toDto(u);
    }

    private User load(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Membre introuvable"));
    }

    private AdminUser toDto(User u) {
        return toDto(u, counts(List.of(u.getId())).get(u.getId()));
    }

    private AdminUser toDto(User u, ModerationCounts counts) {
        ModerationCounts c = counts == null ? new ModerationCounts(0, 0) : counts;
        return new AdminUser(u.getId(), u.getUsername(), u.getDisplayName(), u.getEmail(), u.getAvatarUrl(),
                u.getCountryCode(), u.getRole(), u.getStatus(), u.getReputation(),
                reputation.levelOf(u.getReputation()), c.hidden(), c.warnings(), u.getSuspensionReason(),
                u.getCreatedAt());
    }

    /** Contenus masqués et avertissements, lus dans les dossiers de modération (MOD-2 à MOD-4). */
    private Map<Long, ModerationCounts> counts(List<Long> ids) {
        Map<Long, ModerationCounts> out = new HashMap<>();
        if (ids.isEmpty()) {
            return out;
        }
        jdbc.query("""
                select target_author_id,
                       count(*) filter (where status in ('HIDDEN', 'APPEALED')) as hidden,
                       count(*) filter (where decision_action = 'WARN') as warnings
                from moderation_cases where target_author_id in (:ids) group by target_author_id""",
                new MapSqlParameterSource("ids", ids),
                rs -> {
                    out.put(rs.getLong("target_author_id"),
                            new ModerationCounts(rs.getLong("hidden"), rs.getLong("warnings")));
                });
        return out;
    }
}
