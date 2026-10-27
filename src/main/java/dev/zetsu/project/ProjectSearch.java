package dev.zetsu.project;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/** Filtres de la liste des projets (PRJ-2) en SQL paramétré ; renvoie les identifiants, chargés ensuite par JPA. */
@Component
public class ProjectSearch {

    /**
     * @param status         null : tous les projets sauf les clôturés
     * @param role           texte cherché dans l'intitulé des rôles encore ouverts
     * @param openRolesOnly  seulement les projets qui recrutent encore
     * @param memberUsername projets dont le membre est porteur ou membre accepté, clôturés compris (profil)
     */
    public record Criteria(ProjectStatus status, ProjectType type, String technology, String role,
                           boolean openRolesOnly, String memberUsername) {
    }

    public record Result(List<Long> ids, long total) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public ProjectSearch(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Result search(Criteria c, int page, int size) {
        // Un projet masqué (MOD-2) reste lisible par son porteur sur sa page, pas dans les listes.
        StringBuilder where = new StringBuilder(" where not p.hidden");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (c.status() != null) {
            where.append(" and p.status = :status");
            params.addValue("status", c.status().name());
        } else if (c.memberUsername() == null) {
            where.append(" and p.status <> 'CLOSED'");
        }
        if (c.type() != null) {
            where.append(" and p.type = :type");
            params.addValue("type", c.type().name());
        }
        if (c.technology() != null && !c.technology().isBlank()) {
            // Technologie du projet ou d'un de ses rôles.
            where.append(" and (exists (select 1 from project_technologies pt join tags t on t.id = pt.tag_id"
                    + " where pt.project_id = p.id and t.name = :technology) or exists (select 1 from project_roles r"
                    + " join project_role_technologies rt on rt.role_id = r.id join tags t on t.id = rt.tag_id"
                    + " where r.project_id = p.id and t.name = :technology))");
            params.addValue("technology", c.technology());
        }
        if (c.role() != null && !c.role().isBlank()) {
            where.append(" and exists (select 1 from project_roles r where r.project_id = p.id and r.status = 'OPEN'"
                    + " and r.title ilike '%' || :role || '%')");
            params.addValue("role", escapeLike(c.role().trim()));
        }
        if (c.openRolesOnly()) {
            where.append(" and exists (select 1 from project_roles r where r.project_id = p.id and r.status = 'OPEN')");
        }
        if (c.memberUsername() != null && !c.memberUsername().isBlank()) {
            where.append(" and (p.owner_id = (select id from users where lower(username) = lower(:member))"
                    + " or exists (select 1 from project_members m where m.project_id = p.id and m.status = 'ACCEPTED'"
                    + " and m.user_id = (select id from users where lower(username) = lower(:member))))");
            params.addValue("member", c.memberUsername().trim());
        }

        Long total = jdbc.queryForObject("select count(*) from projects p" + where, params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<Long> ids = jdbc.queryForList("select p.id from projects p" + where
                + " order by p.last_activity_at desc, p.id desc limit :limit offset :offset", params, Long.class);
        return new Result(ids, total == null ? 0 : total);
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
