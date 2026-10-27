package dev.zetsu.project;

/** Demande pour rejoindre un projet (section 5.3) ; acceptée, elle fait du candidat un membre de l'équipe. */
public enum MemberStatus {
    PENDING,
    ACCEPTED,
    REFUSED,
    /** Parti de lui-même ou retiré par le porteur, avec un motif. */
    LEFT
}
