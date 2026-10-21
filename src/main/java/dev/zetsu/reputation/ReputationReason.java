package dev.zetsu.reputation;

/** Barème de réputation. Une annulation enregistre l'opposé du montant d'origine. */
public enum ReputationReason {
    QUESTION_UPVOTED(5),
    QUESTION_DOWNVOTED(-2),
    ANSWER_UPVOTED(10),
    ANSWER_DOWNVOTED(-2),
    ANSWER_ACCEPTED(15),
    ACCEPTED_AN_ANSWER(2);

    private final int points;

    ReputationReason(int points) {
        this.points = points;
    }

    public int points() {
        return points;
    }
}
