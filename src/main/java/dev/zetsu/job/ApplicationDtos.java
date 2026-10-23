package dev.zetsu.job;

import dev.zetsu.mission.MissionDtos.Budget;
import dev.zetsu.user.UserDtos.PublicProfile;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Candidatures aux offres (JOB-3) et propositions sur les missions (JOB-5), suivies ensemble (JOB-7). */
public final class ApplicationDtos {

    private ApplicationDtos() {
    }

    @Schema(name = "MissionApplicationRequest", description = "Se proposer sur une mission")
    public record MissionApplicationRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 40, max = 2000, message = "Entre 40 et 2000 caractères")
            @Schema(requiredMode = REQUIRED,
                    example = "J'ai intégré Wave et Orange Money pour deux boutiques à Abidjan, je peux livrer en 3 jours.")
            String message,
            @Valid @Schema(description = "Montant proposé, si différent du budget indicatif") Budget proposedBudget) {
    }

    @Schema(name = "ApplicationTarget")
    public record ApplicationTarget(
            @Schema(requiredMode = REQUIRED) ApplicationTargetType type,
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(description = "Entreprise pour une offre, null pour une mission") String companyName) {
    }

    @Schema(name = "MyApplication", description = "Candidature ou proposition envoyée par le membre connecté (JOB-7)")
    public record MyApplication(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) ApplicationTarget target,
            @Schema(requiredMode = REQUIRED) ApplicationStatus status,
            @Schema(requiredMode = REQUIRED) String message,
            @Schema(requiredMode = REQUIRED) boolean hasCv,
            Budget proposedBudget,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED, description = "Dernier changement de statut") Instant updatedAt) {
    }

    @Schema(name = "ReceivedApplication", description = "Candidature ou proposition reçue par le recruteur ou l'auteur de la mission")
    public record ReceivedApplication(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) ApplicationTarget target,
            @Schema(requiredMode = REQUIRED, description = "Profil Zetsu du candidat, transmis par sa candidature")
            PublicProfile candidate,
            @Schema(requiredMode = REQUIRED) String message,
            @Schema(requiredMode = REQUIRED, description = "Vrai si un CV est joint : GET /applications/{id}/cv")
            boolean hasCv,
            Budget proposedBudget,
            @Schema(requiredMode = REQUIRED) ApplicationStatus status,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }

    @Schema(name = "ApplicationDecisionRequest", description = "Retenir ou refuser une candidature reçue")
    public record ApplicationDecisionRequest(
            @NotNull(message = "Obligatoire")
            @Schema(requiredMode = REQUIRED, allowableValues = {"SHORTLISTED", "REJECTED"}) ApplicationStatus status) {
    }
}
