package dev.zetsu.playtest;

/** Cycle de vie d'une campagne (section 5 de la conception). */
public enum CampaignStatus {
    /** Modifiable, invisible des autres. */
    DRAFT,
    /** En attente de l'équipe (porteurs de moins de 50 points). */
    PENDING_REVIEW,
    /** Refusée, avec un motif ; le porteur corrige (retour en brouillon) puis renvoie. */
    REJECTED,
    /** Visible, accepte des testeurs tant qu'il reste des places. */
    ACTIVE,
    /** Suspendue par l'équipe : invisible, plus de nouvelles participations, le décompte en cours continue. */
    SUSPENDED,
    /** Objectif atteint ou clôturée par le porteur : plus aucune participation. */
    COMPLETED
}
