package dev.zetsu.challenge;

public enum SubmissionStatus {
    /** Déposé, pas encore noté. */
    PENDING,
    /** Noté et validé : +20 de réputation (barème de la section 8). */
    VALIDATED,
    /** Noté et refusé (dépôt vide, hors sujet, introuvable) : pas de points. */
    REJECTED
}
