package dev.zetsu.moderation;

/** Contenus que l'on peut signaler (MOD-1). */
public enum ReportTargetType {
    QUESTION,
    ANSWER,
    JOB,
    MISSION,
    USER,
    PROJECT,
    /** Une campagne de test fermé (TST). */
    PLAYTEST
}
