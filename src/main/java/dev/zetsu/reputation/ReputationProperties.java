package dev.zetsu.reputation;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Seuils des niveaux et garde-fous anti-abus (REP-2, REP-3). Abaissés par le profil {@code demo} pour que
 * les privilèges soient visibles pendant la démo.
 *
 * @param memberThreshold        réputation pour le niveau Membre (voter, signaler)
 * @param contributorThreshold   réputation pour le niveau Contributeur
 * @param referentThreshold      réputation pour le niveau Référent
 * @param dailyCap               points gagnés au plus par jour grâce aux votes et aux questions
 * @param rewardedQuestionsPerDay questions rémunérées au plus par jour
 * @param rewardedVotesPerPairPerDay votes rémunérés au plus par jour entre les deux mêmes comptes
 */
@ConfigurationProperties("zetsu.reputation")
public record ReputationProperties(
        int memberThreshold,
        int contributorThreshold,
        int referentThreshold,
        int dailyCap,
        int rewardedQuestionsPerDay,
        int rewardedVotesPerPairPerDay) {

    public Level levelOf(int reputation) {
        if (reputation >= referentThreshold) {
            return Level.REFERENT;
        }
        if (reputation >= contributorThreshold) {
            return Level.CONTRIBUTOR;
        }
        if (reputation >= memberThreshold) {
            return Level.MEMBER;
        }
        return Level.NEWCOMER;
    }
}
