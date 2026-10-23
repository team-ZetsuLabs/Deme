package dev.zetsu.moderation;

/**
 * Décisions possibles sur un dossier. Un Référent ne peut qu'ignorer ou masquer (MOD-3) ; l'équipe peut aussi
 * rétablir un contenu, avertir ou suspendre son auteur (MOD-4).
 */
public enum ModerationAction {
    DISMISS,
    HIDE,
    RESTORE,
    WARN,
    SUSPEND
}
