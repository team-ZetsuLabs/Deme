package dev.zetsu.job;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/** Filtres des listes d'offres en SQL paramétré ; renvoie les identifiants, chargés ensuite par JPA. */
@Component
public class JobSearch {

    /**
     * @param status      null pour tous les statuts
     * @param recruiterId null pour tous les recruteurs
     * @param oldestFirst file de validation (JOB-4) ; sinon les plus récentes d'abord
     */
    /** @param includeHidden vrai pour les listes du recruteur et de l'équipe, qui voient les offres masquées (MOD-2) */
    public record Criteria(JobStatus status, Long recruiterId, JobType type, String countryCode, String technology,
                           boolean oldestFirst, boolean includeHidden) {

        public static Criteria published(JobType type, String countryCode, String technology) {
            return new Criteria(JobStatus.PUBLISHED, null, type, countryCode, technology, false, false);
        }
    }

    public record Result(List<Long> ids, long total) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public JobSearch(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Result search(Criteria c, int page, int size) {
        StringBuilder where = new StringBuilder(c.includeHidden() ? " where true" : " where not j.hidden");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (c.status() != null) {
            where.append(" and j.status = :status");
            params.addValue("status", c.status().name());
        }
        if (c.recruiterId() != null) {
            where.append(" and j.recruiter_id = :recruiter");
            params.addValue("recruiter", c.recruiterId());
        }
        if (c.type() != null) {
            where.append(" and j.type = :type");
            params.addValue("type", c.type().name());
        }
        if (c.countryCode() != null) {
            where.append(" and j.country_code = :country");
            params.addValue("country", c.countryCode());
        }
        if (c.technology() != null && !c.technology().isBlank()) {
            where.append(" and exists (select 1 from job_technologies jt join tags t on t.id = jt.tag_id"
                    + " where jt.job_id = j.id and t.name = :technology)");
            params.addValue("technology", c.technology());
        }
        String orderBy = c.oldestFirst() ? " order by j.created_at, j.id" : " order by j.created_at desc, j.id desc";

        Long total = jdbc.queryForObject("select count(*) from jobs j" + where, params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<Long> ids = jdbc.queryForList(
                "select j.id from jobs j" + where + orderBy + " limit :limit offset :offset", params, Long.class);
        return new Result(ids, total == null ? 0 : total);
    }
}
