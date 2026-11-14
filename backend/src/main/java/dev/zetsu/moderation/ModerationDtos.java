package dev.zetsu.moderation;

import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class ModerationDtos {

    private ModerationDtos() {
    }

    @Schema(name = "ReportRequest", description = "Signaler un contenu (MOD-1), à partir du niveau Membre")
    public record ReportRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ReportTargetType targetType,
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED, example = "42") Long targetId,
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ReportReason reason,
            @Size(max = 500, message = "500 caractères maximum")
            @Schema(description = "Précision facultative, lue par le Référent",
                    example = "Même lien de paiement publié sous six questions différentes") String comment) {
    }

    @Schema(name = "ReportReceipt", description = "Accusé de réception d'un signalement")
    public record ReportReceipt(
            @Schema(requiredMode = REQUIRED) Long caseId,
            @Schema(requiredMode = REQUIRED, description = "Vrai si ce signalement a déclenché le masquage automatique (MOD-2)")
            boolean hidden) {
    }

    @Schema(name = "ModerationTarget", description = "Contenu signalé, pour construire le lien et l'aperçu côté front")
    public record ModerationTarget(
            @Schema(requiredMode = REQUIRED) ReportTargetType type,
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED, description = "Titre de la question, de l'offre, de la mission ; "
                    + "début de la réponse ; pseudo pour un profil") String title,
            @Schema(description = "Début du texte signalé, 300 caractères au plus, en texte brut") String excerpt,
            @Schema(description = "Question parente quand la cible est une réponse") Long questionId,
            @Schema(requiredMode = REQUIRED, description = "Auteur du contenu, ou le membre lui-même pour un profil")
            AuthorSummary author) {
    }

    @Schema(name = "ReasonCount")
    public record ReasonCount(
            @Schema(requiredMode = REQUIRED) ReportReason reason,
            @Schema(requiredMode = REQUIRED, example = "3") long count) {
    }

    @Schema(name = "ModerationDecision", description = "Dernière décision prise sur un dossier")
    public record ModerationDecision(
            @Schema(requiredMode = REQUIRED) ModerationAction action,
            @Schema(description = "Motif donné à l'auteur") String note,
            @Schema(requiredMode = REQUIRED, description = "Vrai si la décision vient de l'équipe plutôt que d'un Référent ; "
                    + "le nom de la personne n'est jamais montré à l'auteur") boolean byTeam,
            @Schema(requiredMode = REQUIRED) Instant decidedAt) {
    }

    @Schema(name = "ModerationCase", description = "Tous les signalements d'un même contenu")
    public record ModerationCase(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) ModerationTarget target,
            @Schema(requiredMode = REQUIRED) CaseStatus status,
            @Schema(requiredMode = REQUIRED, description = "Signalements de comptes distincts", example = "4")
            long reportCount,
            @Schema(requiredMode = REQUIRED, description = "Motifs, du plus fréquent au moins fréquent")
            List<ReasonCount> reasons,
            @Schema(requiredMode = REQUIRED, description = "Commentaires des signalants, plus récents d'abord, 5 au plus")
            List<String> comments,
            @Schema(description = "Null tant que personne n'a décidé") ModerationDecision decision,
            @Schema(description = "Texte de la contestation de l'auteur, visible par l'équipe") String appeal,
            @Schema(requiredMode = REQUIRED) Instant firstReportedAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }

    @Schema(name = "CaseDecisionRequest", description = "Décision sur un dossier")
    public record CaseDecisionRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) ModerationAction action,
            @Size(max = 500, message = "500 caractères maximum")
            @Schema(description = "Motif montré à l'auteur ; obligatoire pour masquer, avertir ou suspendre",
                    example = "Publicité répétée pour un service de paiement") String note) {
    }

    @Schema(name = "AppealRequest", description = "L'auteur conteste le masquage de son contenu devant l'équipe (MOD-3)")
    public record AppealRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 20, max = 1000, message = "Entre 20 et 1000 caractères")
            @Schema(requiredMode = REQUIRED,
                    example = "Le lien pointe vers la documentation officielle de l'API Wave, pas vers une offre commerciale.")
            String message) {
    }

    @Schema(name = "MyModeratedContent", description = "Un contenu du membre connecté masqué ou en cours d'examen")
    public record MyModeratedContent(
            @Schema(requiredMode = REQUIRED) Long caseId,
            @Schema(requiredMode = REQUIRED) ModerationTarget target,
            @Schema(requiredMode = REQUIRED) CaseStatus status,
            @Schema(description = "Null pour un masquage automatique (MOD-2)") ModerationDecision decision,
            @Schema(requiredMode = REQUIRED, description = "Vrai si le membre peut encore contester") boolean canAppeal,
            @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }
}
