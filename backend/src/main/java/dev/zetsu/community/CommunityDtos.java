package dev.zetsu.community;

import dev.zetsu.common.CountryCode;
import dev.zetsu.job.JobDtos.ReviewDecision;
import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class CommunityDtos {

    private CommunityDtos() {
    }

    @Schema(name = "CommunitySummary", description = "Communauté telle qu'affichée dans une liste (COM-1)")
    public record CommunitySummary(
            @Schema(requiredMode = REQUIRED, example = "senegal", description = "Adresse /communities/{slug}") String slug,
            @Schema(requiredMode = REQUIRED, example = "Sénégal") String name,
            @Schema(requiredMode = REQUIRED) CommunityKind kind,
            @Schema(example = "SN", description = "Rempli pour une communauté de pays") String countryCode,
            @Schema(example = "flutter", description = "Rempli pour une communauté de techno : étiquette de ses questions")
            String tag,
            @Schema(requiredMode = REQUIRED, description = "Texte brut, 200 caractères au plus") String description,
            @Schema(requiredMode = REQUIRED) long memberCount,
            @Schema(requiredMode = REQUIRED, description = "Questions visibles du pays ou de l'étiquette") long questionCount,
            @Schema(requiredMode = REQUIRED, description = "Le membre connecté en fait partie ; false sans session")
            boolean joined) {
    }

    @Schema(name = "CommunityDetail", description = "Page d'une communauté (COM-1)")
    public record CommunityDetail(
            @Schema(requiredMode = REQUIRED, example = "senegal") String slug,
            @Schema(requiredMode = REQUIRED, example = "Sénégal") String name,
            @Schema(requiredMode = REQUIRED) CommunityKind kind,
            @Schema(example = "SN") String countryCode,
            @Schema(example = "flutter") String tag,
            @Schema(requiredMode = REQUIRED) String description,
            @Schema(requiredMode = REQUIRED) long memberCount,
            @Schema(requiredMode = REQUIRED) long questionCount,
            @Schema(requiredMode = REQUIRED) boolean joined,
            @Schema(requiredMode = REQUIRED, description = "Règles propres à la communauté, texte brut, "
                    + "en plus des règles générales") List<String> rules,
            @Schema(requiredMode = REQUIRED, description = "Référents nommés par l'équipe") List<AuthorSummary> referents,
            @Schema(requiredMode = REQUIRED, description = "Jusqu'à 5 membres qui ont gagné le plus de points sur les "
                    + "questions de la communauté ces 30 derniers jours") List<AuthorSummary> topMembers,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "MembershipResult", description = "Réponse de POST et DELETE /communities/{slug}/members")
    public record MembershipResult(
            @Schema(requiredMode = REQUIRED) boolean joined,
            @Schema(requiredMode = REQUIRED) long memberCount) {
    }

    @Schema(name = "CommunityRequest", description = "Proposition d'un Référent (COM-2) ou création par l'équipe. "
            + "countryCode est obligatoire pour une communauté de pays, tag pour une communauté de techno.")
    public record CommunityRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 3, max = 40, message = "Entre 3 et 40 caractères")
            @Schema(requiredMode = REQUIRED, example = "Flutter") String name,

            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) CommunityKind kind,

            @CountryCode @Schema(example = "SN") String countryCode,

            @Size(max = 30, message = "30 caractères maximum")
            @Schema(example = "flutter", description = "Étiquette créée à l'acceptation si elle n'existe pas") String tag,

            @NotBlank(message = "Obligatoire") @Size(min = 30, max = 200, message = "Entre 30 et 200 caractères")
            @Schema(requiredMode = REQUIRED, description = "Texte brut") String description,

            @Size(max = 5, message = "5 règles maximum")
            @Schema(description = "0 à 5 règles de 200 caractères au plus, texte brut")
            List<@NotBlank(message = "Règle vide") @Size(max = 200, message = "200 caractères maximum") String> rules) {
    }

    @Schema(name = "CommunityProposal", description = "Proposition de communauté, vue par son auteur (COM-2)")
    public record CommunityProposalView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String name,
            @Schema(requiredMode = REQUIRED) CommunityKind kind,
            String countryCode,
            String tag,
            @Schema(requiredMode = REQUIRED) ProposalStatus status,
            @Schema(description = "Motif donné par l'équipe, rempli si refusée") String rejectionReason,
            @Schema(description = "Adresse de la communauté créée, rempli si acceptée") String slug,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "AdminCommunity", description = "Communauté dans le back office, ouverte ou fermée")
    public record AdminCommunity(
            @Schema(requiredMode = REQUIRED) String slug,
            @Schema(requiredMode = REQUIRED) String name,
            @Schema(requiredMode = REQUIRED) CommunityKind kind,
            String countryCode,
            String tag,
            @Schema(requiredMode = REQUIRED) String description,
            @Schema(requiredMode = REQUIRED) List<String> rules,
            @Schema(requiredMode = REQUIRED) CommunityStatus status,
            @Schema(requiredMode = REQUIRED) long memberCount,
            @Schema(requiredMode = REQUIRED) long questionCount,
            @Schema(requiredMode = REQUIRED) List<AuthorSummary> referents,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }

    @Schema(name = "AdminCommunityProposal", description = "Proposition dans la file de l'équipe (COM-2)")
    public record AdminCommunityProposal(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String name,
            @Schema(requiredMode = REQUIRED) CommunityKind kind,
            String countryCode,
            String tag,
            @Schema(requiredMode = REQUIRED) String description,
            @Schema(requiredMode = REQUIRED) List<String> rules,
            @Schema(requiredMode = REQUIRED) ProposalStatus status,
            String rejectionReason,
            String slug,
            @Schema(requiredMode = REQUIRED) AuthorSummary proposer,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            Instant reviewedAt) {
    }

    @Schema(name = "CommunityReferentsRequest", description = "Référents de la communauté, dans l'ordre d'affichage. "
            + "Remplace la liste ; une liste vide retire tout le monde.")
    public record ReferentsRequest(
            @NotNull(message = "Obligatoire") @Size(max = 10, message = "10 Référents maximum")
            @Schema(requiredMode = REQUIRED, example = "[\"aminata_dev\", \"moussa_s\"]") List<String> usernames) {
    }

    @Schema(name = "CommunityProposalReviewRequest", description = "Décision de l'équipe sur une proposition (COM-2)")
    public record ProposalReviewRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ReviewDecision decision,
            @Size(max = 500, message = "500 caractères maximum")
            @Schema(description = "Obligatoire pour un refus, montré au Référent",
                    example = "Une communauté Afrique de l'Ouest couvre déjà ce sujet") String reason) {
    }
}
