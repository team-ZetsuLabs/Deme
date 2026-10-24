package dev.zetsu.notification;

public enum NotificationTargetType {
    QUESTION,
    ANSWER,
    JOB,
    MISSION,
    APPLICATION,
    CHALLENGE,
    PROJECT,
    /** Un profil, pour un avertissement ou un profil masqué. */
    USER,
    /** Une proposition de communauté (COM-2). */
    COMMUNITY_PROPOSAL
}
