package dev.zetsu.playtest;

/**
 * Ce que Zetsu sait d'un testeur (section 2 de la conception). Google ne donne aucune API pour lire la liste des
 * testeurs : rien n'est vérifié automatiquement, et un compteur à 14 n'est jamais une conformité Google Play.
 */
public enum ProofLevel {
    /** Le testeur dit avoir rejoint le test et installé l'application. */
    DECLARED,
    /** Le porteur a vu son adresse dans la liste des testeurs de la Play Console. */
    VERIFIED,
    /** Jours requis écoulés depuis la déclaration, sans abandon. */
    COMPLETED
}
