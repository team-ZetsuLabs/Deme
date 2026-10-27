package dev.zetsu.question;

import dev.zetsu.question.QuestionDtos.SimilarQuestion;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Fil et recherche plein texte des questions (QA-6, QA-7) : titre, détails et étiquettes, en français et en anglais.
 * Renvoie seulement les identifiants de la page ; les questions sont ensuite chargées par JPA.
 */
@Repository
public class QuestionSearch {

    /** Filtres du fil (QA-6) : Toutes, Sans solution (aucune réponse acceptée), Résolues. */
    public enum Status {
        ALL,
        UNSOLVED,
        SOLVED
    }

    /** Tri du fil (QA-6) : récentes ou votées. RELEVANCE, par défaut, vaut RECENT sans texte recherché. */
    public enum Sort {
        RELEVANCE,
        RECENT,
        VOTES
    }

    public record Criteria(String text, String tag, String countryCode, MobileMoneyOperator operator,
                           NetworkQuality network, String authorUsername, String community, Status status,
                           Sort sort) {
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
        // Une question masquée (MOD-2) reste lisible par son auteur sur sa page, pas dans le fil.
        StringBuilder where = new StringBuilder(" where not q.hidden");
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
        if (c.network() != null) {
            where.append(" and q.network_quality = :network");
            params.addValue("network", c.network().name());
        }
        if (c.authorUsername() != null) {
            where.append(" and q.author_id = (select id from users where lower(username) = lower(:author))");
            params.addValue("author", c.authorUsername());
        }
        if (c.community() != null) {
            // Communauté (COM-1) : questions de son pays ou de son étiquette. Adresse inconnue : aucune question.
            where.append(" and exists (select 1 from communities co where co.slug = :community and ("
                    + "(co.kind = 'COUNTRY' and q.country_code = co.country_code) or (co.kind = 'TECH' and exists ("
                    + "select 1 from question_tags cqt where cqt.question_id = q.id and cqt.tag_id = co.tag_id))))");
            params.addValue("community", c.community());
        }
        if (c.status() == Status.UNSOLVED) {
            where.append(" and q.accepted_answer_id is null");
        } else if (c.status() == Status.SOLVED) {
            where.append(" and q.accepted_answer_id is not null");
        }
        Sort sort = c.sort() == null ? Sort.RELEVANCE : c.sort();

        String orderBy = switch (sort) {
            case RELEVANCE -> hasText
                    ? " order by ts_rank(q.search_vector, " + TSQUERY + ") desc, q.created_at desc, q.id desc"
                    : " order by q.created_at desc, q.id desc";
            case VOTES -> " order by q.score desc, q.created_at desc, q.id desc";
            case RECENT -> " order by q.created_at desc, q.id desc";
        };

        Long total = jdbc.queryForObject("select count(*) from questions q" + where, params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<Long> ids = jdbc.queryForList(
                "select q.id from questions q" + where + orderBy + " limit :limit offset :offset", params, Long.class);
        return new Result(ids, total == null ? 0 : total);
    }

    /**
     * Mots présents dans la plupart des titres de questions mais absents des listes de mots vides de PostgreSQL :
     * partagés par la moitié du site, ils ne rendent pas deux questions similaires.
     */
    private static final Set<String> QUESTION_WORDS = Set.of("comment", "pourquoi", "quoi", "quel", "quelle",
            "quels", "quelles", "faire", "how", "why", "what", "which");

    /**
     * Questions similaires (QA-8). Un titre en cours de saisie est rarement complet : on ne demande pas tous ses mots
     * (ET), mais au moins deux (ou le seul, s'il n'y en a qu'un), en classant par nombre de mots partagés.
     * Le texte est indexé en français et en anglais : un mot vide dans l'une des deux langues (« que », « the »)
     * deviendrait un mot utile dans l'autre, on l'écarte donc s'il est vide dans l'une ou l'autre.
     * Ignore les questions masquées et, en modification, la question elle-même.
     */
    public List<SimilarQuestion> similar(String title, Long excludeId, int limit) {
        String words = Arrays.stream(title.split("\\s+"))
                .filter(w -> !QUESTION_WORDS.contains(w.toLowerCase(Locale.ROOT)))
                .collect(Collectors.joining(" "));
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("title", words)
                .addValue("exclude", excludeId == null ? -1L : excludeId)
                .addValue("limit", limit);
        return jdbc.query("""
                with words as (
                    select distinct plainto_tsquery('french', w) || plainto_tsquery('english', w) as query
                    from regexp_split_to_table(:title, '\\s+') w
                    where numnode(plainto_tsquery('french', w)) > 0 and numnode(plainto_tsquery('english', w)) > 0
                ), any_word as (
                    select cast(string_agg('(' || query::text || ')', ' | ') as tsquery) as query, count(*) as total
                    from words
                )
                select q.id, q.title, q.score, q.answer_count, q.accepted_answer_id is not null as solved
                from questions q
                cross join any_word a
                cross join lateral (select count(*) as shared from words w where q.search_vector @@ w.query) m
                where not q.hidden and q.id <> :exclude and q.search_vector @@ a.query
                  and m.shared >= least(2, a.total)
                order by m.shared desc, ts_rank(q.search_vector, a.query) desc, solved desc, q.score desc, q.id desc
                limit :limit""", params,
                (rs, i) -> new SimilarQuestion(rs.getLong("id"), rs.getString("title"), rs.getInt("score"),
                        rs.getInt("answer_count"), rs.getBoolean("solved")));
    }
}
