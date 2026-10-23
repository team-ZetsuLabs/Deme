package dev.zetsu.moderation;

/** Un dossier regroupe tous les signalements d'un même contenu. */
public enum CaseStatus {
    /** À traiter par un Référent. */
    OPEN,
    /** Signalements ignorés : le contenu reste visible. */
    DISMISSED,
    /** Contenu masqué, automatiquement (MOD-2) ou par décision. */
    HIDDEN,
    /** L'auteur conteste le masquage : à trancher par l'équipe. */
    APPEALED,
    /** Contestation acceptée par l'équipe : le contenu est de nouveau visible. */
    RESTORED
}
