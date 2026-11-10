package dev.zetsu.playtest;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

/** Historique des campagnes (test_campaign_events) et « toujours inscrit » (test_check_ins). */
@Component
public class PlaytestEvents {

    /** Actions inscrites dans l'historique. */
    public enum Action {
        CREATED, EDITED, SUBMITTED, APPROVED, AUTO_APPROVED, REJECTED, SUSPENDED, REACTIVATED, CLOSED, COMPLETED,
        JOINED, REPLACED, CONFIRMED, VERIFIED, WITHDRAWN, EXPIRED, REMOVED, PARTICIPATION_COMPLETED
    }

    public record Row(Long id, Long participationId, Long actorId, Action action, String note, Instant createdAt) {
    }

    private final NamedParameterJdbcTemplate jdbc;

    public PlaytestEvents(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void log(Long campaignId, Long participationId, Long actorId, Action action, String note, Instant now) {
        jdbc.update("""
                insert into test_campaign_events (campaign_id, participation_id, actor_id, action, note, created_at)
                values (:campaign, :participation, :actor, :action, :note, :now)
                """, new MapSqlParameterSource()
                .addValue("campaign", campaignId)
                .addValue("participation", participationId, Types.BIGINT)
                .addValue("actor", actorId, Types.BIGINT)
                .addValue("action", action.name())
                .addValue("note", note == null ? null : note.length() > 300 ? note.substring(0, 300) : note,
                        Types.VARCHAR)
                .addValue("now", Timestamp.from(now)));
    }

    public List<Row> of(Long campaignId, int limit, int offset) {
        return jdbc.query("""
                select id, participation_id, actor_id, action, note, created_at from test_campaign_events
                where campaign_id = :campaign order by created_at desc, id desc limit :limit offset :offset
                """, new MapSqlParameterSource("campaign", campaignId).addValue("limit", limit)
                .addValue("offset", offset), (rs, i) -> {
            long participation = rs.getLong("participation_id");
            Long participationId = rs.wasNull() ? null : participation;
            long actor = rs.getLong("actor_id");
            Long actorId = rs.wasNull() ? null : actor;
            return new Row(rs.getLong("id"), participationId, actorId, Action.valueOf(rs.getString("action")),
                    rs.getString("note"), rs.getTimestamp("created_at").toInstant());
        });
    }

    public long count(Long campaignId) {
        Long n = jdbc.queryForObject("select count(*) from test_campaign_events where campaign_id = :campaign",
                new MapSqlParameterSource("campaign", campaignId), Long.class);
        return n == null ? 0 : n;
    }

    /** Une ligne par jour (UTC) ; false si le testeur a déjà pointé aujourd'hui. */
    public boolean checkIn(Long participationId, Instant now) {
        // « on conflict » plutôt qu'une exception : dans PostgreSQL, une erreur annulerait toute la transaction.
        return jdbc.update("insert into test_check_ins (participation_id, day) values (:p, :day) on conflict do nothing",
                new MapSqlParameterSource("p", participationId).addValue("day", today(now))) == 1;
    }

    public boolean checkedIn(Long participationId, Instant now) {
        Boolean exists = jdbc.queryForObject(
                "select exists (select 1 from test_check_ins where participation_id = :p and day = :day)",
                new MapSqlParameterSource("p", participationId).addValue("day", today(now)), Boolean.class);
        return Boolean.TRUE.equals(exists);
    }

    private static LocalDate today(Instant now) {
        return LocalDate.ofInstant(now, ZoneOffset.UTC);
    }
}
