package dev.zetsu.reputation;

/** Badges (REP-4). Les seuils sont dans {@link BadgeProperties} ; seuls les contenus visibles comptent. */
public enum Badge {
    /** Première question ou première réponse publiée. */
    FIRST_STEP,
    /** Entraide : un certain nombre de réponses publiées. */
    HELPER,
    /** Résolveur : un certain nombre de réponses acceptées. */
    SOLVER,
    /** Challenger : un certain nombre de dépôts de défi validés. */
    CHALLENGER,
    /** Polyglotte : réponses acceptées ou votées positivement dans plusieurs étiquettes différentes. */
    POLYGLOT,
    /** Aide locale : réponses à des questions d'autres membres posées dans son propre pays. */
    LOCAL_HELP
}
