package dev.zetsu.reputation;

import dev.zetsu.reputation.ReputationDtos.BadgeProgress;
import jakarta.persistence.EntityManager;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Badges (REP-4). Les compteurs sont recalculés depuis les contenus, jamais tenus à la main : appeler
 * {@link #refresh} après une action qui peut en faire gagner un suffit, et un appel en trop ne coûte qu'une requête.
 */
@Service
public class BadgeService {

    /** Un compteur par badge, dans l'ordre de l'énumération. Contenus masqués (MOD-2) exclus. */
    private static final String COUNTS = """
            select
              (select count(*) from questions where author_id = :user and not hidden)
                + (select count(*) from answers where author_id = :user and not hidden) as first_step,
              (select count(*) from answers where author_id = :user and not hidden) as helper,
              (select count(*) from answers a join questions q on q.accepted_answer_id = a.id
                where a.author_id = :user and not a.hidden) as solver,
              (select count(*) from submissions where member_id = :user and status = 'VALIDATED') as challenger,
              (select count(distinct qt.tag_id) from answers a
                join questions q on q.id = a.question_id
                join question_tags qt on qt.question_id = q.id
                where a.author_id = :user and not a.hidden and (a.score > 0 or q.accepted_answer_id = a.id)) as polyglot,
              (select count(*) from answers a
                join questions q on q.id = a.question_id
                join users u on u.id = a.author_id
                where a.author_id = :user and not a.hidden and q.author_id <> :user
                  and q.country_code = u.country_code) as local_help""";

    private final NamedParameterJdbcTemplate jdbc;
    private final EntityManager entityManager;
    private final BadgeProperties props;

    public BadgeService(NamedParameterJdbcTemplate jdbc, EntityManager entityManager, BadgeProperties props) {
        this.jdbc = jdbc;
        this.entityManager = entityManager;
        this.props = props;
    }

    /** Attribue les badges atteints et pas encore gagnés. */
    @Transactional
    public void refresh(Long userId) {
        // Les compteurs sont lus en SQL : les changements JPA en attente (dépôt validé, réponse acceptée) d'abord.
        entityManager.flush();
        Map<Badge, Long> counts = counts(userId);
        for (Badge badge : Badge.values()) {
            if (counts.get(badge) >= props.target(badge)) {
                jdbc.update("""
                        insert into user_badges (user_id, badge) values (:user, :badge)
                        on conflict do nothing""", new MapSqlParameterSource("user", userId).addValue("badge", badge.name()));
            }
        }
    }

    /** Badges gagnés, du plus ancien au plus récent. */
    @Transactional(readOnly = true)
    public List<Badge> earned(Long userId) {
        return jdbc.queryForList("select badge from user_badges where user_id = :user order by awarded_at, badge",
                new MapSqlParameterSource("user", userId), String.class).stream().map(Badge::valueOf).toList();
    }

    /** Les six badges avec la progression du membre, après une mise à jour. */
    @Transactional
    public List<BadgeProgress> progress(Long userId) {
        refresh(userId);
        Map<Badge, Long> counts = counts(userId);
        Map<Badge, Instant> awarded = new EnumMap<>(Badge.class);
        jdbc.query("select badge, awarded_at from user_badges where user_id = :user",
                new MapSqlParameterSource("user", userId),
                rs -> {
                    awarded.put(Badge.valueOf(rs.getString("badge")), rs.getTimestamp("awarded_at").toInstant());
                });
        return Arrays.stream(Badge.values()).map(badge -> {
            int target = props.target(badge);
            return new BadgeProgress(badge, awarded.containsKey(badge), awarded.get(badge),
                    (int) Math.min(counts.get(badge), target), target);
        }).toList();
    }

    private Map<Badge, Long> counts(Long userId) {
        return jdbc.queryForObject(COUNTS, new MapSqlParameterSource("user", userId), (rs, i) -> {
            Map<Badge, Long> counts = new EnumMap<>(Badge.class);
            for (Badge badge : Badge.values()) {
                counts.put(badge, rs.getLong(badge.name().toLowerCase(Locale.ROOT)));
            }
            return counts;
        });
    }
}
