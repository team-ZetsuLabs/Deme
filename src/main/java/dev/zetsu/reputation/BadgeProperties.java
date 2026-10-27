package dev.zetsu.reputation;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Seuils des badges (REP-4). Abaissés par le profil {@code demo}, comme les niveaux.
 *
 * @param helperAnswers       réponses publiées pour Entraide
 * @param solverAccepted      réponses acceptées pour Résolveur
 * @param challengerValidated dépôts de défi validés pour Challenger
 * @param polyglotTags        étiquettes distinctes pour Polyglotte
 * @param localHelpAnswers    réponses à des questions de son pays pour Aide locale
 */
@ConfigurationProperties("zetsu.badges")
public record BadgeProperties(int helperAnswers, int solverAccepted, int challengerValidated, int polyglotTags,
                              int localHelpAnswers) {

    public int target(Badge badge) {
        return switch (badge) {
            case FIRST_STEP -> 1;
            case HELPER -> helperAnswers;
            case SOLVER -> solverAccepted;
            case CHALLENGER -> challengerValidated;
            case POLYGLOT -> polyglotTags;
            case LOCAL_HELP -> localHelpAnswers;
        };
    }
}
