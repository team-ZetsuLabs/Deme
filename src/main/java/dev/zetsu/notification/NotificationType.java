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
    COMMUNITY_PROPOSAL_DECISION,
    /** Demande reçue pour rejoindre mon projet (PRJ-3). */
    PROJECT_REQUEST_RECEIVED,
    /** Le porteur m'a retiré de l'équipe d'un projet ; le motif est sur ma demande. */
    PROJECT_MEMBER_REMOVED,
    /** Un projet dont je fais partie est clôturé : +10 de réputation (PRJ-6). */
    PROJECT_CLOSED,
    /** Nouvelle campagne de test fermé, pour un membre qui fait du mobile (TST-4). */
    PLAYTEST_NEW_CAMPAIGN,
    /** Porteur : un testeur a rejoint (outcome JOINED) ou déclaré l'installation (outcome CONFIRMED). */
    PLAYTEST_JOINED,
    /** Testeur : installation pas encore déclarée 24 heures après avoir rejoint. */
    PLAYTEST_INSTALL_REMINDER,
    /** Testeur : pas de « toujours inscrit » depuis 3 jours. */
    PLAYTEST_STAY_REMINDER,
    /** Testeur et porteur : la participation se termine dans 2 jours. */
    PLAYTEST_ENDING_SOON,
    /** Testeur et porteur : 14 jours effectués, +5 de réputation pour le testeur. */
    PLAYTEST_PARTICIPATION_DONE,
    /** Porteur : un testeur est parti (outcome DROPPED, ou EXPIRED sans installation déclarée sous 48 heures). */
    PLAYTEST_TESTER_LEFT,
    /** Porteur : une place libérée a été reprise par un nouveau testeur. */
    PLAYTEST_TESTER_REPLACED,
    /** Porteur : plus aucune place libre. */
    PLAYTEST_CAMPAIGN_FULL,
    /** Porteur : décision de l'équipe (outcome APPROVED, REJECTED, SUSPENDED, REACTIVATED). */
    PLAYTEST_CAMPAIGN_REVIEWED,
    /** Testeur : retiré de la campagne par le porteur ou l'équipe ; le motif est sur la participation. */
    PLAYTEST_REMOVED,
    /** Porteur : un testeur a envoyé un retour ; outcome vaut BUG, SUGGESTION ou OTHER. */
    PLAYTEST_FEEDBACK
}
