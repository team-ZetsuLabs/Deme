package dev.zetsu.playtest;

import dev.zetsu.reputation.Level;

import java.time.Duration;
import java.util.List;

/** Délais et seuils des sections 5 à 8 de la conception, en un seul endroit. */
final class PlaytestRules {

    private PlaytestRules() {
    }

    /** Sans installation déclarée après ce délai, la place se libère. */
    static final Duration INSTALL_DEADLINE = Duration.ofHours(48);
    static final Duration INSTALL_REMINDER_AFTER = Duration.ofHours(24);
    /** Sans « toujours inscrit » depuis ce délai : rappel au testeur, « à confirmer » pour le porteur. */
    static final Duration STAY_REMINDER_AFTER = Duration.ofDays(3);
    static final Duration ENDING_SOON = Duration.ofDays(2);
    /** L'adresse Google est effacée après ce délai, une fois la participation finie. */
    static final Duration EMAIL_RETENTION = Duration.ofDays(30);
    /** Back office : campagne active sans nouvelle participation depuis ce délai. */
    static final Duration INACTIVE_AFTER = Duration.ofDays(7);
    /** Back office : part de testeurs « à confirmer » au-delà de laquelle une campagne cale. */
    static final double STALLED_SHARE = 0.3;
    /** Un porteur de ce niveau (Membre, 50 points) publie sans relecture ; les nouveaux sont relus. */
    static final Level TRUSTED_LEVEL = Level.MEMBER;
    /** Technologies des membres prévenus d'une nouvelle campagne. */
    static final List<String> MOBILE_TAGS = List.of("android", "kotlin", "flutter", "dart", "react-native",
            "jetpack-compose", "ionic", "expo", "swift", "ios");
}
