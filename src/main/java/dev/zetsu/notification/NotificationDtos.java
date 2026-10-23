package dev.zetsu.notification;

import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    @Schema(name = "NotificationTarget", description = "Contenu concerné, pour construire le lien côté front")
    public record NotificationTarget(
            @Schema(requiredMode = REQUIRED) NotificationTargetType type,
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED, description = "Titre de la question, de l'offre, de la mission, du défi…")
            String title,
            @Schema(description = "Question parente quand la cible est une réponse") Long questionId) {
    }

    @Schema(name = "Notification")
    public record Notification(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) NotificationType type,
            @Schema(requiredMode = REQUIRED) boolean read,
            @Schema(description = "Membre à l'origine de l'événement ; null pour un événement de la plateforme")
            AuthorSummary actor,
            @Schema(requiredMode = REQUIRED) NotificationTarget target,
            @Schema(description = "Statut décidé, pour APPLICATION_DECIDED (SHORTLISTED, REJECTED) "
                    + "et JOB_REVIEWED (PUBLISHED, REJECTED)", example = "SHORTLISTED")
            String outcome,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "UnreadCount")
    public record UnreadCount(@Schema(requiredMode = REQUIRED, example = "3") long count) {
    }

    @Schema(name = "MarkReadRequest")
    public record MarkReadRequest(
            @Size(max = 100, message = "100 notifications maximum")
            @Schema(description = "Notifications à marquer comme lues ; absent ou null : toutes (« Tout marquer comme lu »)",
                    example = "[41, 42]")
            List<Long> ids) {
    }
}
