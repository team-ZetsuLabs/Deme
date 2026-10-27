package dev.zetsu.ai;

import dev.zetsu.question.QuestionDtos.QuestionContext;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class AiDtos {

    private AiDtos() {
    }

    @Schema(name = "QuestionAssistRequest", description = "Brouillon de question à améliorer (IA-1). Rien n'est enregistré.")
    public record QuestionAssistRequest(
            @NotBlank(message = "Obligatoire") @Size(max = 150, message = "150 caractères maximum")
            @Schema(requiredMode = REQUIRED, example = "ça marche pas") String title,

            @Size(max = 30000, message = "30000 caractères maximum")
            @Schema(description = "Markdown, tel que saisi") String body,

            @Size(max = 20000, message = "20000 caractères maximum")
            @Schema(description = "Code facultatif, en texte brut") String code,

            @Size(max = 4, message = "4 étiquettes maximum")
            @Schema(description = "Étiquettes déjà choisies", example = "[\"flutter\"]") List<String> tags,

            @Valid @Schema(description = "Contexte déjà rempli") QuestionContext context) {
    }

    @Schema(name = "SuggestedTag")
    public record SuggestedTag(
            @Schema(requiredMode = REQUIRED, example = "spring-boot") String name,
            @Schema(requiredMode = REQUIRED, description = "Faux si l'étiquette sera créée à la publication")
            boolean existing) {
    }

    @Schema(name = "QuestionAssistResponse", description = """
            Suggestions de l'assistant (IA-1), à afficher avec l'étiquette « Suggéré par l'IA ». Chacune s'applique \
            d'un clic ou s'ignore ; rien n'est modifié sans l'accord du membre.""")
    public record QuestionAssistResponse(
            @Schema(description = "Titre plus clair, entre 15 et 150 caractères ; null si le titre convient déjà")
            String title,
            @Schema(requiredMode = REQUIRED, description = "De 0 à 4 étiquettes, sans celles déjà choisies")
            List<SuggestedTag> tags,
            @Schema(requiredMode = REQUIRED, description = """
                    Contexte africain détecté dans le texte ; chaque champ est null s'il n'est pas détecté ou \
                    déjà rempli""")
            QuestionContext context,
            @Schema(requiredMode = REQUIRED, description = "Informations manquantes, à traduire côté front")
            List<MissingInfo> missing) {
    }
}
