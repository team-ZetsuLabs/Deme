package dev.zetsu.tag;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class TagDtos {

    private TagDtos() {
    }

    @Schema(name = "TagCount")
    public record TagCount(
            @Schema(requiredMode = REQUIRED, example = "mobile-money") String name,
            @Schema(requiredMode = REQUIRED, example = "42") long questionCount) {
    }

    /** Une étiquette vue par l'équipe (MOD-4), avec tous ses usages. */
    @Schema(name = "AdminTag")
    public record AdminTag(
            @Schema(requiredMode = REQUIRED, example = "mobile-money") String name,
            @Schema(requiredMode = REQUIRED, example = "42") long questionCount,
            @Schema(requiredMode = REQUIRED, example = "3") long jobCount,
            @Schema(requiredMode = REQUIRED, example = "5") long missionCount,
            @Schema(requiredMode = REQUIRED, description = "Membres qui l'ont dans leur stack", example = "17")
            long memberCount) {
    }

    @Schema(name = "TagRequest")
    public record TagRequest(
            @NotBlank(message = "Obligatoire") @Size(max = 30, message = "30 caractères maximum")
            @Schema(requiredMode = REQUIRED, description = "Lettres minuscules, chiffres et . + # -",
                    example = "orange-money") String name) {
    }

    @Schema(name = "TagMergeRequest")
    public record TagMergeRequest(
            @NotBlank(message = "Obligatoire")
            @Schema(requiredMode = REQUIRED, description = "Étiquette qui reste", example = "mobile-money") String into) {
    }
}
