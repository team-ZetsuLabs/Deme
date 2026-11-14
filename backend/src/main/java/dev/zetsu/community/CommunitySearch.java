package dev.zetsu.community;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lectures des communautés qui demandent des comptes (membres, questions) ou une jointure sans entité : adhésions,
 * Référents nommés et membres les plus utiles du mois.
 */
@Repository
public class CommunitySearch {

    /** Ligne d'une liste : la communauté et ses chiffres, pour le membre {@code :viewer} (null sans session). */
    public record Row(long id, String slug, String name, CommunityKind kind, String countryCode, String tag,
                      String description, CommunityStatus status, long memberCount, long questionCount,
                      boolean joined) {
    }

    public record Result(List<Row> rows, long total) {
    }

    /** Une question appartient à une communauté par son pays ou par son étiquette ; masquée (MOD-2), elle ne compte pas. */
    private static final String SELECT = """
            select c.id, c.slug, c.name, c.kind, c.country_code, t.name as tag, c.description, c.status,
                   (select count(*) from community_members m where m.community_id = c.id) as member_count,
                   case when c.kind = 'COUNTRY'
                        then (select count(*) from questions q where not q.hidden and q.country_code = c.country_code)
                        else (select count(*) from question_tags qt join questions q on q.id = qt.question_id
                              where qt.tag_id = c.tag_id and not q.hidden) end as question_count,
                   exists (select 1 from community_members m
                           where m.community_id = c.id and m.user_id = :viewer) as joined
            from communities c left join tags t on t.id = c.tag_id""";

    private static final RowMapper<Row> ROW = (rs, i) -> new Row(rs.getLong("id"), rs.getString("slug"),
            rs.getString("name"), CommunityKind.valueOf(rs.getString("kind")), rs.getString("country_code"),
            rs.getString("tag"), rs.getString("description"), CommunityStatus.valueOf(rs.getString("status")),
            rs.getLong("member_count"), rs.getLong("question_count"), rs.getBoolean("joined"));

    private final NamedParameterJdbcTemplate jdbc;

    public CommunitySearch(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Les plus grandes communautés d'abord. {@code text} cherche dans le nom, l'étiquette et l'adresse : « senegal »
     * trouve « Sénégal » par son adresse sans accent. {@code status} null : ouvertes et fermées (back office).
     */
    public Result search(CommunityStatus status, CommunityKind kind, String text, String textSlug, Long viewerId,
                         int page, int size) {
        StringBuilder where = new StringBuilder(" where true");
        MapSqlParameterSource params = new MapSqlParameterSource("viewer", viewerId);
        if (status != null) {
            where.append(" and c.status = :status");
            params.addValue("status", status.name());
        }
        if (kind != null) {
            where.append(" and c.kind = :kind");
            params.addValue("kind", kind.name());
        }
        if (text != null && !text.isBlank()) {
            where.append(" and (lower(c.name) like :text escape '\\' or t.name like :text escape '\\'");
            params.addValue("text", "%" + escape(text.trim().toLowerCase()) + "%");
            if (!textSlug.isEmpty()) {
                where.append(" or c.slug like :slug escape '\\'");
                params.addValue("slug", "%" + escape(textSlug) + "%");
            }
            where.append(")");
        }
        Long total = jdbc.queryForObject("select count(*) from communities c left join tags t on t.id = c.tag_id"
                + where, params, Long.class);
        params.addValue("limit", size).addValue("offset", (long) page * size);
        List<Row> rows = jdbc.query("select * from (" + SELECT + where + ") r"
                + " order by r.member_count desc, r.name, r.id limit :limit offset :offset", params, ROW);
        return new Result(rows, total == null ? 0 : total);
    }

    public Map<Long, Row> rows(Collection<Long> ids, Long viewerId) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return jdbc.query(SELECT + " where c.id in (:ids)",
                        new MapSqlParameterSource("viewer", viewerId).addValue("ids", ids), ROW)
                .stream().collect(Collectors.toMap(Row::id, Function.identity()));
    }

    /** Communautés ouvertes du membre, dans l'ordre où il les a rejointes (la plus récente d'abord). */
    public List<Row> joinedBy(long userId) {
        return jdbc.query(SELECT + " join community_members mine on mine.community_id = c.id and mine.user_id = :viewer"
                + " where c.status = 'OPEN' order by mine.joined_at desc, c.id desc",
                new MapSqlParameterSource("viewer", userId), ROW);
    }

    /** Vrai si le membre vient de rejoindre la communauté, faux s'il en faisait déjà partie. */
    public boolean join(long communityId, long userId) {
        return jdbc.update("insert into community_members (community_id, user_id) values (:community, :user)"
                + " on conflict do nothing", membership(communityId, userId)) > 0;
    }

    public void leave(long communityId, long userId) {
        jdbc.update("delete from community_members where community_id = :community and user_id = :user",
                membership(communityId, userId));
    }

    public long memberCount(long communityId) {
        Long n = jdbc.queryForObject("select count(*) from community_members where community_id = :community",
                new MapSqlParameterSource("community", communityId), Long.class);
        return n == null ? 0 : n;
    }

    public List<Long> referentIds(long communityId) {
        return jdbc.queryForList("select user_id from community_referents where community_id = :community"
                + " order by position", new MapSqlParameterSource("community", communityId), Long.class);
    }

    public void replaceReferents(long communityId, List<Long> userIds) {
        MapSqlParameterSource params = new MapSqlParameterSource("community", communityId);
        jdbc.update("delete from community_referents where community_id = :community", params);
        for (int i = 0; i < userIds.size(); i++) {
            jdbc.update("insert into community_referents (community_id, user_id, position)"
                    + " values (:community, :user, :position)",
                    membership(communityId, userIds.get(i)).addValue("position", i));
        }
    }

    /**
     * Membres qui ont gagné le plus de points sur les questions de la communauté ces 30 derniers jours (votes et
     * réponses acceptées), sans les comptes supprimés.
     */
    public List<Long> topMemberIds(Community c, int limit) {
        String match = c.getKind() == CommunityKind.COUNTRY
                ? "q.country_code = :country"
                : "exists (select 1 from question_tags qt where qt.question_id = q.id and qt.tag_id = :tag)";
        MapSqlParameterSource params = new MapSqlParameterSource("limit", limit)
                .addValue("country", c.getCountryCode())
                .addValue("tag", c.getTag() == null ? null : c.getTag().getId());
        return jdbc.queryForList("select re.user_id from reputation_events re"
                + " join questions q on q.id = re.question_id join users u on u.id = re.user_id"
                + " where re.created_at >= now() - interval '30 days' and not q.hidden and u.status <> 'DELETED'"
                + " and " + match
                + " group by re.user_id having sum(re.delta) > 0"
                + " order by sum(re.delta) desc, re.user_id limit :limit", params, Long.class);
    }

    /**
     * Vrai si une autre communauté (ouverte ou fermée) a déjà cette adresse, ce nom, ce pays ou cette étiquette.
     * {@code excludeId} : la communauté modifiée, qui ne se gêne pas elle-même.
     */
    public boolean taken(String slug, String name, String countryCode, String tag, Long excludeId) {
        Boolean taken = jdbc.queryForObject("""
                select exists (select 1 from communities c left join tags t on t.id = c.tag_id
                               where c.id <> coalesce(:exclude, -1)
                                 and (c.slug = :slug or lower(c.name) = lower(:name)
                                      or (c.kind = 'COUNTRY' and c.country_code = :country)
                                      or (c.kind = 'TECH' and t.name = :tag)))""",
                new MapSqlParameterSource("exclude", excludeId).addValue("slug", slug).addValue("name", name)
                        .addValue("country", countryCode).addValue("tag", tag), Boolean.class);
        return Boolean.TRUE.equals(taken);
    }

    /** AUTH-6 : un compte supprimé quitte ses communautés et n'est plus Référent nulle part. */
    public void forget(long userId) {
        MapSqlParameterSource params = new MapSqlParameterSource("user", userId);
        jdbc.update("delete from community_members where user_id = :user", params);
        jdbc.update("delete from community_referents where user_id = :user", params);
    }

    private static MapSqlParameterSource membership(long communityId, long userId) {
        return new MapSqlParameterSource("community", communityId).addValue("user", userId);
    }

    private static String escape(String s) {
        return s.replaceAll("[%_\\\\]", "\\\\$0");
    }
}
