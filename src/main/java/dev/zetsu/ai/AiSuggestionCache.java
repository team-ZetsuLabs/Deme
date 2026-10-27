package dev.zetsu.ai;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/** Cache des réponses du fournisseur (table ai_suggestions), pour ne pas repayer deux fois le même brouillon. */
@Component
class AiSuggestionCache {

    private final JdbcTemplate jdbc;
    private final AiProperties props;

    AiSuggestionCache(JdbcTemplate jdbc, AiProperties props) {
        this.jdbc = jdbc;
        this.props = props;
    }

    Optional<String> get(String key) {
        List<String> found = jdbc.queryForList(
                "select response from ai_suggestions where cache_key = ? and created_at > ?", String.class,
                key, oldestValid());
        return found.stream().findFirst();
    }

    void put(String key, String response) {
        jdbc.update("""
                insert into ai_suggestions (cache_key, response) values (?, ?)
                on conflict (cache_key) do update set response = excluded.response, created_at = now()""",
                key, response);
    }

    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.HOURS)
    void purgeExpired() {
        jdbc.update("delete from ai_suggestions where created_at <= ?", oldestValid());
    }

    private Timestamp oldestValid() {
        return Timestamp.from(Instant.now().minus(props.cacheTtl()));
    }
}
