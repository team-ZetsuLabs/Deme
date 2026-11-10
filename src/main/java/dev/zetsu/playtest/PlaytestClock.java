package dev.zetsu.playtest;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;

/** Horloge du domaine, remplaçable dans les tests pour faire passer les 14 jours. */
@Component
public class PlaytestClock {

    private Clock clock = Clock.systemUTC();

    public Instant now() {
        return clock.instant();
    }

    void set(Clock clock) {
        this.clock = clock;
    }
}
