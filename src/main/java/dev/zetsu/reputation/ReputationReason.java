package dev.zetsu.reputation;

/** Barème de la section 8 du cahier. Une annulation enregistre l'opposé de ce qui avait été accordé. */
public enum ReputationReason {
    QUESTION_ASKED(5),
    QUESTION_UPVOTED(2),
    ANSWER_UPVOTED(2),
    ANSWER_ACCEPTED(15),
    ACCEPTED_AN_ANSWER(2),
    CHALLENGE_VALIDATED(20),
    PROJECT_COMPLETED(10),
    /** Participation à un test fermé terminée (TST-3). */
    PLAYTEST_COMPLETED(5),
    SPAM_REMOVED(-50);

    private final int points;

    ReputationReason(int points) {
        this.points = points;
    }

    public int points() {
        return points;
    }

    /** Gains soumis au plafond quotidien (REP-3). */
    boolean capped() {
        return this == QUESTION_ASKED || this == QUESTION_UPVOTED || this == ANSWER_UPVOTED;
    }
}
