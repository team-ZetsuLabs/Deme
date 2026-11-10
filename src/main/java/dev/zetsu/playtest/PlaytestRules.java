package dev.zetsu.playtest;

import dev.zetsu.reputation.Level;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
    /** Plateformes toujours relues par l'équipe, même pour un porteur de confiance : le lien mène hors des stores. */
    static final Set<Platform> ALWAYS_REVIEWED = Set.of(Platform.WEB);

    /** Technologies des membres prévenus d'une nouvelle campagne, par plateforme. */
    static final Map<Platform, List<String>> ANNOUNCE_TAGS = Map.of(
            Platform.GOOGLE_PLAY, List.of("android", "kotlin", "flutter", "dart", "react-native", "jetpack-compose",
                    "ionic", "expo"),
            Platform.APP_STORE, List.of("ios", "swift", "swiftui", "flutter", "dart", "react-native", "ionic",
                    "expo"),
            Platform.WEB, List.of("javascript", "typescript", "react", "vue", "angular", "svelte", "html", "css",
                    "php", "laravel", "django", "nextjs"));

    static final int MAX_TESTERS = 100;

    /** Bornes de chaque plateforme (TST-7). */
    record Limits(int minTesters, int defaultTesters, int minDays, int defaultDays, int maxDays) {
    }

    static final Map<Platform, Limits> LIMITS = Map.of(
            // Google exige 12 testeurs pendant 14 jours.
            Platform.GOOGLE_PLAY, new Limits(12, 14, 14, 14, 60),
            // TestFlight n'impose rien : un build reste installable 90 jours.
            Platform.APP_STORE, new Limits(1, 10, 1, 7, 60),
            // Pas de décompte : requiredDays vaut toujours 0.
            Platform.WEB, new Limits(1, 10, 0, 0, 0));

    /** Campagne web clôturée : un testeur installé depuis moins longtemps ne gagne pas ses points. */
    static final Duration UNTRACKED_MIN_STAY = Duration.ofDays(1);
    static final String CLOSED_TOO_SOON_REASON = "Campagne clôturée moins de 24 heures après l'installation";
    static final String CLOSED_BEFORE_INSTALL_REASON = "Campagne clôturée avant la déclaration d'installation";
}
