package dev.zetsu.stats;

import dev.zetsu.reputation.ReputationProperties;
import dev.zetsu.stats.StatsDtos.HomeStats;
import dev.zetsu.stats.StatsDtos.LevelCounts;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    /** Contenus masqués (MOD-2), membres suspendus et comptes supprimés (AUTH-6) exclus. */
    private static final String COUNTS = """
            with active as (
              select reputation, country_code from users where status = 'ACTIVE' and deleted_at is null
            )
            select
              (select count(*) from questions where not hidden) as questions,
              (select count(*) from questions where not hidden and accepted_answer_id is not null) as solved,
              (select count(*) from answers where not hidden) as answers,
              (select count(*) from active) as members,
              (select count(distinct country_code) from active) as countries,
              (select count(*) from active where reputation >= :member and reputation < :contributor) as member_level,
              (select count(*) from active where reputation >= :contributor and reputation < :referent) as contributor_level,
              (select count(*) from active where reputation >= :referent) as referent_level""";

    private final NamedParameterJdbcTemplate jdbc;
    private final ReputationProperties levels;

    public StatsService(NamedParameterJdbcTemplate jdbc, ReputationProperties levels) {
        this.jdbc = jdbc;
        this.levels = levels;
    }

    @Transactional(readOnly = true)
    public HomeStats home() {
        var params = new MapSqlParameterSource("member", levels.memberThreshold())
                .addValue("contributor", levels.contributorThreshold())
                .addValue("referent", levels.referentThreshold());
        return jdbc.queryForObject(COUNTS, params, (rs, i) -> {
            long questions = rs.getLong("questions");
            double solvedRate = questions == 0 ? 0 : Math.round(100.0 * rs.getLong("solved") / questions) / 100.0;
            return new HomeStats(questions, rs.getLong("answers"), solvedRate, rs.getLong("members"),
                    rs.getLong("countries"), new LevelCounts(rs.getLong("member_level"),
                    rs.getLong("contributor_level"), rs.getLong("referent_level")));
        });
    }
}
