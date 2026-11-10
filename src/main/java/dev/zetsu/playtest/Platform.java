package dev.zetsu.playtest;

/**
 * Où vit l'application testée (TST-7). Chaque plateforme a ses règles : identifiant, lien d'inscription, nombre de
 * testeurs, jours de test et façon de suivre les testeurs.
 */
public enum Platform {
    /** Test fermé de la Play Console : 12 testeurs au moins, 14 jours au moins, suivi jour par jour. */
    GOOGLE_PLAY,
    /** Lien public TestFlight : nombre de testeurs et de jours au choix du porteur, suivi jour par jour. */
    APP_STORE,
    /** Application web : pas d'identifiant, fenêtre de test libre jusqu'à la clôture, pas de décompte. */
    WEB;

    public Tracking tracking() {
        return this == WEB ? Tracking.NONE : Tracking.DAILY;
    }
}
