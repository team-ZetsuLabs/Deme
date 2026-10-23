package dev.zetsu.auth;

import dev.zetsu.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * AUTH-3 : 5 essais ratés sur un même email bloquent la connexion à ce compte pendant 15 minutes,
 * même avec le bon mot de passe. Une connexion réussie remet le compteur à zéro. En mémoire (une instance).
 */
@Component
public class LoginAttempts {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK = Duration.ofMinutes(15);

    private record State(int failures, long firstFailureMillis, long lockedUntilMillis) {
    }

    private final Map<String, State> states = new ConcurrentHashMap<>();
    private final Clock clock;

    public LoginAttempts() {
        this(Clock.systemUTC());
    }

    LoginAttempts(Clock clock) {
        this.clock = clock;
    }

    public void checkNotLocked(String email) {
        State s = states.get(key(email));
        if (s != null && s.lockedUntilMillis > clock.millis()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "LOGIN_LOCKED",
                    "Trop d'essais ratés, réessayez dans 15 minutes");
        }
    }

    public void failed(String email) {
        long now = clock.millis();
        states.compute(key(email), (k, s) -> {
            if (s == null || now - s.firstFailureMillis >= LOCK.toMillis()) {
                return new State(1, now, 0);
            }
            int failures = s.failures + 1;
            return new State(failures, s.firstFailureMillis, failures >= MAX_FAILURES ? now + LOCK.toMillis() : 0);
        });
    }

    public void succeeded(String email) {
        states.remove(key(email));
    }

    public void reset() {
        states.clear();
    }

    private static String key(String email) {
        return email.trim().toLowerCase();
    }

    @Scheduled(fixedDelay = 10, timeUnit = TimeUnit.MINUTES)
    void purgeExpired() {
        long now = clock.millis();
        states.entrySet().removeIf(e -> e.getValue().lockedUntilMillis < now
                && now - e.getValue().firstFailureMillis >= LOCK.toMillis());
    }
}
