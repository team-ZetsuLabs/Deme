package dev.zetsu.challenge;

import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class ChallengeDtos {

    /** Dépôt GitHub public : https://github.com/<compte>/<dépôt>, sans chemin ni paramètre. */
    public static final String GITHUB_REPO = "^https://github\\.com/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})/[A-Za-z0-9._-]{1,100}/?$";

    private ChallengeDtos() {
    }

    @Schema(name = "MySubmission", description = "Dépôt du membre connecté sur ce défi")
    public record MySubmission(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED, example = "https://github.com/awa-kone/zetsu-defi-ussd") String repositoryUrl,
            @Schema(requiredMode = REQUIRED) SubmissionStatus status,
            @Schema(description = "Note sur 100, null tant que l'équipe n'a pas noté", example = "84") Integer score,
            @Schema(description = "Retour de l'équipe") String feedback,
            @Schema(requiredMode = REQUIRED) Instant submittedAt) {
    }

    @Schema(name = "Challenge", description = "Un défi (CH-1)")
    public record Challenge(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED, example = "Un menu USSD de paiement de facture") String title,
            @Schema(requiredMode = REQUIRED, description = "Énoncé, Markdown d'origine") String statementMarkdown,
            @Schema(requiredMode = REQUIRED, description = "Énoncé en HTML nettoyé, à afficher avec MemberContent")
            String statementHtml,
            @Schema(requiredMode = REQUIRED, description = "Spécifications, Markdown d'origine") String specificationsMarkdown,
            @Schema(requiredMode = REQUIRED, description = "Spécifications en HTML nettoyé") String specificationsHtml,
            @Schema(requiredMode = REQUIRED, example = "[\"ussd\", \"node.js\"]") List<String> technologies,
            @Schema(requiredMode = REQUIRED) ChallengeStatus status,
            @Schema(requiredMode = REQUIRED) Instant startsAt,
            @Schema(requiredMode = REQUIRED, description = "Fin des dépôts, base du compte à rebours") Instant endsAt,
            @Schema(requiredMode = REQUIRED, description = "Heure du serveur à la réponse : le compte à rebours se cale "
                    + "dessus plutôt que sur l'horloge du téléphone") Instant serverTime,
            @Schema(requiredMode = REQUIRED, example = "37") long submissionCount,
            @Schema(description = "Null sans session ou sans dépôt") MySubmission mySubmission) {
    }

    @Schema(name = "SubmissionRequest", description = "Dépôt d'un lien GitHub public (CH-2)")
    public record SubmissionRequest(
            @NotBlank(message = "Obligatoire") @Size(max = 200, message = "200 caractères maximum")
            @Pattern(regexp = GITHUB_REPO, message = "Adresse de dépôt GitHub attendue : https://github.com/compte/depot")
            @Schema(requiredMode = REQUIRED, example = "https://github.com/awa-kone/zetsu-defi-ussd") String repositoryUrl,
            @Size(max = 500, message = "500 caractères maximum")
            @Schema(description = "Mot pour l'équipe, facultatif", example = "Testé avec le simulateur Africa's Talking")
            String comment) {
    }

    @Schema(name = "LeaderboardEntry")
    public record LeaderboardEntry(
            @Schema(requiredMode = REQUIRED, description = "Rang ; deux notes égales partagent le même rang", example = "1")
            int rank,
            @Schema(requiredMode = REQUIRED) AuthorSummary member,
            @Schema(requiredMode = REQUIRED, example = "92") int score,
            @Schema(requiredMode = REQUIRED) Instant submittedAt) {
    }

    @Schema(name = "AdminSubmission", description = "Un dépôt vu par l'équipe, pour la notation (CH-3)")
    public record AdminSubmission(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) Long challengeId,
            @Schema(requiredMode = REQUIRED) AuthorSummary member,
            @Schema(requiredMode = REQUIRED, example = "https://github.com/awa-kone/zetsu-defi-ussd") String repositoryUrl,
            String comment,
            @Schema(requiredMode = REQUIRED) SubmissionStatus status,
            @Schema(example = "84") Integer score,
            String feedback,
            @Schema(requiredMode = REQUIRED) Instant submittedAt,
            Instant reviewedAt) {
    }

    @Schema(name = "ChallengeRequest", description = "Création ou modification d'un défi par l'équipe")
    public record ChallengeRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 120, message = "Entre 10 et 120 caractères")
            @Schema(requiredMode = REQUIRED, example = "Un menu USSD de paiement de facture") String title,
            @NotBlank(message = "Obligatoire") @Size(min = 50, max = 10000, message = "Entre 50 et 10000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown") String statement,
            @NotBlank(message = "Obligatoire") @Size(min = 50, max = 20000, message = "Entre 50 et 20000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown") String specifications,
            @NotNull(message = "Obligatoire") @Size(max = 5, message = "5 technologies maximum")
            @Schema(requiredMode = REQUIRED, example = "[\"ussd\", \"node.js\"]") List<String> technologies,
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) Instant startsAt,
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) Instant endsAt) {
    }

    @Schema(name = "SubmissionReviewRequest", description = "Note de l'équipe sur un dépôt (CH-3)")
    public record SubmissionReviewRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED, allowableValues = {"VALIDATED", "REJECTED"})
            SubmissionStatus status,
            @NotNull(message = "Obligatoire") @Min(value = 0, message = "Entre 0 et 100") @Max(value = 100, message = "Entre 0 et 100")
            @Schema(requiredMode = REQUIRED, example = "84") Integer score,
            @Size(max = 1000, message = "1000 caractères maximum")
            @Schema(description = "Retour montré au membre",
                    example = "Parcours clair et gestion du délai de session USSD, il manque des tests sur les montants.")
            String feedback) {
    }
}
