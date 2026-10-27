package dev.zetsu.ai;

/** Information qui manque à une question (IA-1). Le front traduit chaque valeur ; le modèle ne choisit que dans cette liste. */
public enum MissingInfo {
    /** Le message d'erreur exact, ou la trace. */
    ERROR_MESSAGE,
    /** Le code concerné, réduit à l'essentiel. */
    CODE,
    /** La version du langage, du framework ou de la bibliothèque. */
    TECH_VERSION,
    /** Le résultat attendu, par opposition à ce qui se passe. */
    EXPECTED_RESULT,
    /** Ce que le membre a déjà essayé. */
    ATTEMPTS,
    /** L'environnement : système, appareil, navigateur, hébergeur. */
    ENVIRONMENT
}
