package dev.zetsu.challenge;

/** Calculé à partir des dates du défi et de l'heure du serveur. */
public enum ChallengeStatus {
    /** Créé par l'équipe, pas encore commencé : visible dans le back office seulement. */
    UPCOMING,
    /** Dépôts ouverts jusqu'à endsAt. */
    OPEN,
    /** Dépôts fermés ; l'équipe note encore ou a fini de noter. */
    CLOSED
}
