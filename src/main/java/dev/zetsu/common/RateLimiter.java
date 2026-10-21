package dev.zetsu.common;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limitation de débit en mémoire, par fenêtre fixe. Suffit pour une seule instance de l'application ;
 * si on passe à plusieurs instances, il faudra la déplacer dans PostgreSQL.
 */
@Component
public class RateLimiter {

    public enum Rule {
        LOGIN(10, Duration.ofMinutes(5)),
        REGISTER(5, Duration.ofHours(1)),
        PUBLISH(20, Duration.ofHours(1)),
        VOTE(60, Duration.ofMinutes(10)),
        AI(20, Duration.ofHours(1));

        final int limit;
        final Duration window;

        Rule(int limit, Duration window) {
            this.limit = limit;
            this.window = window;
        }
    }

    private record Window(long startMillis, int count) {
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock;
    private volatile boolean enabled = true;

    public RateLimiter() {
        this(Clock.systemUTC());
    }

    RateLimiter(Clock clock) {
        this.clock = clock;
    }

    /** Lève une erreur 429 {@code RATE_LIMITED} si la clé a dépassé la limite de la règle. */
    public void check(Rule rule, String key) {
        if (!enabled) {
            return;
        }
        long now = clock.millis();
        Window w = windows.compute(rule.name() + ':' + key, (k, current) -> {
            if (current == null || now - current.startMillis >= rule.window.toMillis()) {
                return new Window(now, 1);
            }
            return new Window(current.startMillis, current.count + 1);
        });
        if (w.count > rule.limit) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Trop de tentatives, réessayez plus tard");
        }
    }

    /** Pour les tests uniquement. */
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void reset() {
        windows.clear();
    }

    @Scheduled(fixedDelay = 10, timeUnit = java.util.concurrent.TimeUnit.MINUTES)
    void purgeExpired() {
        long now = clock.millis();
        long longest = 0;
        for (Rule r : Rule.values()) {
            longest = Math.max(longest, r.window.toMillis());
        }
        long maxAge = longest;
        windows.entrySet().removeIf(e -> now - e.getValue().startMillis >= maxAge);
    }
}
