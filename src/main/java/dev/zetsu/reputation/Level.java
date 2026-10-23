package dev.zetsu.reputation;

/** Niveaux de la section 8 du cahier. Les seuils sont dans la configuration ({@link ReputationProperties}). */
public enum Level {
    /** Poser, répondre, candidater. */
    NEWCOMER,
    /** Voter, signaler. */
    MEMBER,
    /** Proposer des tags, voir les signalements. */
    CONTRIBUTOR,
    /** Masquer un contenu signalé, traiter la file, proposer et voter pour les défis. */
    REFERENT;

    public boolean atLeast(Level other) {
        return compareTo(other) >= 0;
    }
}
