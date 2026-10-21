package dev.zetsu.question;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Liste et recherche plein texte des questions (PostgreSQL {@code tsvector}, français et anglais).
 * Renvoie seulement les identifiants de la page ; les questions sont ensuite chargées par JPA.
 */
@Repository
public class QuestionSearch {

    public enum Sort {
        /** Les plus pertinentes d'abord (par défaut quand {@code q} est fourni, sinon équivaut à RECENT). */
        RELEVANCE,
        RECENT,
        SCORE,
        /** Seulement les questions sans réponse, les plus récentes d'abord. */
        UNANSWERED
    }

    public record Criteria(String text, String tag, String countryCode, MobileMoneyOperator operator,
                           String authorUsername, Sort sort) {
    }

    public record Result(List<Long> ids, long total) {
    }

    private static final String TSQUERY =
            "(websearch_to_tsquery('french', :text) || websearch_to_tsquery('english', :text))";

    private final NamedParameterJdbcTemplate jdbc;

    public QuestionSearch(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Result search(Criteria c, int page, int size) {
        StringBuilder where = new StringBuilder(" where true");
        MapSqlParameterSource params = new MapSqlParameterSource();
        boolean hasText = c.text() != null && !c.text().isBlank();

        if (hasText) {
            where.append(" and q.search_vector @@ ").append(TSQUERY);
            params.addValue("text", c.text().trim());
        }
        if (c.tag() != null && !c.tag().isBlank()) {
            where.append(" and exists (select 1 from question_tags qt join tags t on t.id = qt.tag_id"
                    + " where qt.question_id = q.id and t.name = :tag)");
            params.addValue("tag", c.tag());
        }
        if (c.countryCode() != null) {
            where.append(" and q.country_code = :country");
            params.addValue("country", c.countryCode());
        }
        if (c.operator() != null) {
            where.append(" and q.mobile_money_operator = :operator");
            params.addValue("operator", c.operator().name());
        }
        if (c.authorUsername() != null) {
            where.append(" and q.author_id = (select id from users where lower(username) = lower(:author))");
            params.addValue("author", c.authorUsername());
        }
        Sort sort = c.sort() == null ? Sort.RELEVANCE : c.sort();
        if (sort == Sort.UNANSWERED) {
            where.append(" and q.answer_count = 0");
        }

        String orderBy = switch (sort) {
            case RELEVANCE -> hasText
                    ? " order by ts_rank(q.search_vector, " + TSQUERY + ") desc, q.created_at desc, q.id desc"
                    : " order by q.created_at desc, q.id desc";
            case SCORE -> " order by q.score desc, q.created_at desc, q.id desc";
            case RECENT, UNANSWERED -> " order by q.created_at desc, q.id desc";
        };

        Long total = jdbc.queryForObject("select count(*) from questions q" + where, params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<Long> ids = jdbc.queryForList(
                "select q.id from questions q" + where + orderBy + " limit :limit offset :offset", params, Long.class);
        return new Result(ids, total == null ? 0 : total);
    }
}
