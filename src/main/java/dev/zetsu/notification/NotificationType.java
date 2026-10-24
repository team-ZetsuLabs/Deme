package dev.zetsu.notification;

/** NOT-1. Le front compose le texte traduit à partir du type, de l'acteur et du titre de la cible. */
public enum NotificationType {
    /** Réponse à ma question. */
    ANSWER_POSTED,
    /** Ma réponse a été acceptée. */
    ANSWER_ACCEPTED,
    /** Vote positif sur ma question ou ma réponse. */
    VOTE_RECEIVED,
    /** Nouvelle offre qui correspond à ma stack. */
    JOB_MATCH,
    /** Nouvelle mission qui correspond à ma stack. */
    MISSION_MATCH,
    /** Candidature ou proposition reçue sur mon offre ou ma mission. */
    APPLICATION_RECEIVED,
    /** Décision sur ma candidature ou ma proposition (retenue, refusée). */
    APPLICATION_DECIDED,
    /** Mon offre a été validée ou refusée par l'équipe. */
    JOB_REVIEWED,
    /** Un nouveau défi a commencé. */
    CHALLENGE_STARTED,
    /** Décision sur ma demande pour rejoindre un projet (P1). */
    PROJECT_REQUEST_DECIDED,
    /** Mon contenu a été masqué, automatiquement ou par décision (MOD-2, MOD-3). */
    CONTENT_HIDDEN,
    /** Ma contestation a été acceptée : mon contenu est de nouveau visible. */
    CONTENT_RESTORED,
    /** L'équipe m'a adressé un avertissement (MOD-4). */
    ACCOUNT_WARNED,
    /** Mon dépôt de défi a été noté (CH-3). */
    SUBMISSION_REVIEWED,
    /** L'équipe a accepté ou refusé ma proposition de communauté (COM-2). */
    COMMUNITY_PROPOSAL_DECISION
}
