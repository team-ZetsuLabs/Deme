package dev.zetsu.job;

import dev.zetsu.common.CountryCode;
import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class JobDtos {

    private JobDtos() {
    }

    @Schema(name = "JobRequest", description = "Création ou modification complète d'une offre (JOB-4). "
            + "Toute modification renvoie l'offre en attente de validation.")
    public record JobRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 120, message = "Entre 10 et 120 caractères")
            @Schema(requiredMode = REQUIRED, example = "Développeur back-end Java, paiements mobiles") String title,

            @NotBlank(message = "Obligatoire") @Size(min = 2, max = 80, message = "Entre 2 et 80 caractères")
            @Schema(requiredMode = REQUIRED, example = "Kora Pay") String companyName,

            @Size(max = 200, message = "200 caractères maximum")
            @Pattern(regexp = "^https://.+", message = "Adresse en https:// attendue")
            @Schema(example = "https://korapay.example") String companyWebsite,

            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) JobType type,

            @CountryCode @Schema(example = "SN", description = "Facultatif pour une offre à distance") String countryCode,

            @Size(max = 80, message = "80 caractères maximum") @Schema(example = "Dakar") String city,

            @NotNull(message = "Obligatoire") @Size(min = 1, max = 10, message = "Entre 1 et 10 technologies")
            @Schema(requiredMode = REQUIRED, example = "[\"java\", \"spring-boot\", \"postgresql\"]")
            List<String> technologies,

            @NotBlank(message = "Obligatoire") @Size(min = 100, max = 20000, message = "Entre 100 et 20000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.") String description,

            @Size(max = 120, message = "120 caractères maximum")
            @Schema(example = "600 000 à 900 000 XOF par mois") String compensation) {
    }

    /** JOB-2 : correspondance entre la stack du membre connecté et les technologies demandées. */
    @Schema(name = "StackMatch")
    public record StackMatch(
            @Schema(requiredMode = REQUIRED, example = "[\"java\", \"postgresql\"]") List<String> matched,
            @Schema(requiredMode = REQUIRED, example = "[\"spring-boot\"]") List<String> missing,
            @Schema(requiredMode = REQUIRED, example = "67", description = "Part des technologies demandées, de 0 à 100")
            int percent) {
    }

    @Schema(name = "MyApplicationRef", description = "Candidature du membre connecté sur cette cible")
    public record MyApplicationRef(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) ApplicationStatus status) {
    }

    @Schema(name = "JobSummary", description = "Offre telle qu'affichée dans une liste")
    public record JobSummary(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED) String companyName,
            @Schema(requiredMode = REQUIRED) JobType type,
            String countryCode,
            String city,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            String compensation,
            @Schema(requiredMode = REQUIRED) JobStatus status,
            @Schema(description = "Correspondance avec la stack du membre connecté, de 0 à 100 ; null sans session ou sans stack")
            Integer matchPercent,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "JobDetail")
    public record JobDetail(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED) String companyName,
            String companyWebsite,
            @Schema(requiredMode = REQUIRED) JobType type,
            String countryCode,
            String city,
            @Schema(requiredMode = REQUIRED) List<String> technologies,
            @Schema(requiredMode = REQUIRED, description = "Markdown d'origine, pour pré-remplir le formulaire d'édition")
            String descriptionMarkdown,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String descriptionHtml,
            String compensation,
            @Schema(requiredMode = REQUIRED) JobStatus status,
            @Schema(description = "Motif du refus par l'équipe, visible par le recruteur et l'équipe seulement")
            String rejectionReason,
            @Schema(requiredMode = REQUIRED) AuthorSummary recruiter,
            @Schema(description = "Null sans session ou sans stack") StackMatch match,
            @Schema(description = "Null si le membre connecté n'a pas postulé") MyApplicationRef myApplication,
            @Schema(description = "Nombre de candidatures, visible par le recruteur et l'équipe seulement")
            Integer applicationCount,
            @Schema(requiredMode = REQUIRED, description = "Vrai si le membre connecté peut modifier ou clore l'offre")
            boolean canEdit,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }

    public enum ReviewDecision {
        APPROVE,
        REJECT
    }

    @Schema(name = "JobReviewRequest", description = "Décision de l'équipe sur une offre en attente (JOB-4)")
    public record JobReviewRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ReviewDecision decision,
            @Size(max = 500, message = "500 caractères maximum")
            @Schema(description = "Obligatoire pour un refus, montré au recruteur",
                    example = "Rémunération à préciser avant publication") String reason) {
    }
}
