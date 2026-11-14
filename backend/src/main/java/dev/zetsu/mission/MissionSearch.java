package dev.zetsu.mission;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/** Filtres de la liste des missions en SQL paramétré ; renvoie les identifiants, chargés ensuite par JPA. */
@Component
public class MissionSearch {

    public record Criteria(MissionStatus status, MissionKind kind, String countryCode, String technology,
                           String authorUsername) {
    }

    public record Result(List<Long> ids, long total) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public MissionSearch(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Result search(Criteria c, int page, int size) {
        // Une mission masquée (MOD-2) reste lisible par son auteur sur sa page, pas dans les listes.
        StringBuilder where = new StringBuilder(" where not m.hidden");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (c.status() != null) {
            where.append(" and m.status = :status");
            params.addValue("status", c.status().name());
        }
        if (c.kind() != null) {
            where.append(" and m.kind = :kind");
            params.addValue("kind", c.kind().name());
        }
        if (c.countryCode() != null) {
            where.append(" and m.country_code = :country");
            params.addValue("country", c.countryCode());
        }
        if (c.technology() != null && !c.technology().isBlank()) {
            where.append(" and exists (select 1 from mission_technologies mt join tags t on t.id = mt.tag_id"
                    + " where mt.mission_id = m.id and t.name = :technology)");
            params.addValue("technology", c.technology());
        }
        if (c.authorUsername() != null && !c.authorUsername().isBlank()) {
            where.append(" and m.author_id = (select id from users where lower(username) = lower(:author))");
            params.addValue("author", c.authorUsername().trim());
        }

        Long total = jdbc.queryForObject("select count(*) from missions m" + where, params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<Long> ids = jdbc.queryForList("select m.id from missions m" + where
                + " order by m.created_at desc, m.id desc limit :limit offset :offset", params, Long.class);
        return new Result(ids, total == null ? 0 : total);
    }
}
