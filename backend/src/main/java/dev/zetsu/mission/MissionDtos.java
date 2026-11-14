package dev.zetsu.mission;

import dev.zetsu.common.CountryCode;
import dev.zetsu.job.JobDtos.MyApplicationRef;
import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class MissionDtos {

    private MissionDtos() {
    }

    /** Montant indicatif, en unités entières de la devise (pas de centimes). */
    @Schema(name = "Budget")
    public record Budget(
            @NotNull(message = "Obligatoire") @PositiveOrZero(message = "Montant positif attendu")
            @Schema(requiredMode = REQUIRED, example = "75000") Long amount,
            @NotNull(message = "Obligatoire") @Pattern(regexp = "^[A-Z]{3}$", message = "Code devise ISO 4217 attendu")
            @Schema(requiredMode = REQUIRED, example = "XOF", description = "Code ISO 4217 : XOF, XAF, GHS, NGN, KES, MAD, EUR…")
            String currency) {
    }

    @Schema(name = "MissionRequest", description = "Création ou modification complète d'une mission entre pairs (JOB-5)")
    public record MissionRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 120, message = "Entre 10 et 120 caractères")
            @Schema(requiredMode = REQUIRED, example = "Brancher Wave sur ma boutique WooCommerce") String title,

            @NotBlank(message = "Obligatoire") @Size(min = 30, max = 10000, message = "Entre 30 et 10000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.") String description,

            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) MissionKind kind,

            @NotNull(message = "Obligatoire") @Valid @Schema(requiredMode = REQUIRED) Budget budget,

            @NotNull(message = "Obligatoire") @Min(value = 1, message = "Entre 1 et 90 jours")
            @Max(value = 90, message = "Entre 1 et 90 jours")
            @Schema(requiredMode = REQUIRED, example = "3", description = "Délai souhaité, en jours") Integer durationDays,

            @Size(max = 10, message = "10 technologies maximum")
            @Schema(example = "[\"woocommerce\", \"php\", \"wave\"]") List<String> technologies,

            @CountryCode @Schema(example = "CI") String countryCode) {
    }

    @Schema(name = "MissionSummary", description = "Mission telle qu'affichée dans une liste")
    public record MissionSummary(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED) MissionKind kind,
            @Schema(requiredMode = REQUIRED) Budget budget,
            @Schema(requiredMode = REQUIRED) int durationDays,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            String countryCode,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED) MissionStatus status,
            @Schema(requiredMode = REQUIRED) int applicationCount,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "MissionDetail")
    public record MissionDetail(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED, description = "Markdown d'origine, pour pré-remplir le formulaire d'édition")
            String descriptionMarkdown,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String descriptionHtml,
            @Schema(requiredMode = REQUIRED) MissionKind kind,
            @Schema(requiredMode = REQUIRED) Budget budget,
            @Schema(requiredMode = REQUIRED) int durationDays,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            String countryCode,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED) MissionStatus status,
            @Schema(requiredMode = REQUIRED) int applicationCount,
            @Schema(description = "Null si le membre connecté ne s'est pas proposé") MyApplicationRef myApplication,
            @Schema(requiredMode = REQUIRED, description = "Vrai si le membre connecté est l'auteur")
            boolean canEdit,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }
}
