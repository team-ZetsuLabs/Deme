package dev.zetsu.playtest;

/** Façon de suivre les testeurs, déduite de la plateforme (TST-7). */
public enum Tracking {
    /**
     * Décompte de requiredDays jours à partir de la déclaration d'installation, « toujours inscrit » une fois par
     * jour, rappels, fin automatique.
     */
    DAILY,
    /**
     * Fenêtre libre : pas de décompte (requiredDays vaut 0, endsAt reste vide), pas de « toujours inscrit ». Les
     * testeurs en cours terminent à la clôture de la campagne.
     */
    NONE
}
