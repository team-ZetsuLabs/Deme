package dev.zetsu.playtest;

import java.util.List;

/** Cycle de vie d'une participation (section 6 de la conception). */
public enum ParticipationStatus {
    /** A cliqué « Je participe » : la place est prise, l'installation reste à déclarer sous 48 heures. */
    JOINED,
    /** A déclaré l'installation : le décompte des jours commence. */
    CONFIRMED,
    /** Le porteur a vu le testeur dans la Play Console. */
    VERIFIED,
    /** Jours requis effectués. */
    COMPLETED,
    /** Le testeur s'est désisté, ou n'a pas déclaré l'installation à temps. */
    DROPPED,
    /** Retiré par le porteur ou l'équipe, avec un motif. */
    REMOVED;

    /** Occupent une place. */
    public static final List<ParticipationStatus> TAKING_A_SPOT = List.of(JOINED, CONFIRMED, VERIFIED, COMPLETED);
    /** En cours : peuvent encore se désister ou être retirés. */
    public static final List<ParticipationStatus> RUNNING = List.of(JOINED, CONFIRMED, VERIFIED);
    /** Décompte en cours. */
    public static final List<ParticipationStatus> COUNTING = List.of(CONFIRMED, VERIFIED);

    public boolean running() {
        return RUNNING.contains(this);
    }

    public boolean counting() {
        return COUNTING.contains(this);
    }
}
