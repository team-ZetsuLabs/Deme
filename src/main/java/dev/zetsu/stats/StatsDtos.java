package dev.zetsu.stats;

import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class StatsDtos {

    private StatsDtos() {
    }

    /** Chiffres de la page d'accueil, calculés depuis la base (correction 2 des maquettes). */
    @Schema(name = "HomeStats")
    public record HomeStats(
            @Schema(requiredMode = REQUIRED, description = "Questions visibles", example = "1284") long questions,
            @Schema(requiredMode = REQUIRED, description = "Réponses visibles", example = "3410") long answers,
            @Schema(requiredMode = REQUIRED, description = "Part des questions visibles qui ont une réponse acceptée, "
                    + "de 0 à 1, arrondie à deux décimales", example = "0.68") double solvedRate,
            @Schema(requiredMode = REQUIRED, description = "Membres actifs (ni suspendus ni supprimés)", example = "2150")
            long members,
            @Schema(requiredMode = REQUIRED, description = "Pays distincts renseignés par ces membres", example = "18")
            long countries,
            @Schema(requiredMode = REQUIRED) LevelCounts levels) {
    }

    /** Membres actifs par niveau exact (section 8). Le niveau Nouveau n'est pas compté. */
    @Schema(name = "LevelCounts")
    public record LevelCounts(
            @Schema(requiredMode = REQUIRED, example = "640") long MEMBER,
            @Schema(requiredMode = REQUIRED, example = "85") long CONTRIBUTOR,
            @Schema(requiredMode = REQUIRED, example = "12") long REFERENT) {
    }
}
