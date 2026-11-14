package dev.zetsu.reputation;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class ReputationDtos {

    private ReputationDtos() {
    }

    @Schema(name = "ReputationEntry")
    public record ReputationEntry(
            @Schema(requiredMode = REQUIRED, example = "10") int delta,
            @Schema(requiredMode = REQUIRED) ReputationReason reason,
            Long questionId,
            Long answerId,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {

        static ReputationEntry from(ReputationEvent e) {
            return new ReputationEntry(e.getDelta(), e.getReason(), e.getQuestionId(), e.getAnswerId(), e.getCreatedAt());
        }
    }

    @Schema(name = "BadgeProgress", description = "Un badge (REP-4) et la progression du membre vers lui")
    public record BadgeProgress(
            @Schema(requiredMode = REQUIRED) Badge badge,
            @Schema(requiredMode = REQUIRED) boolean earned,
            @Schema(description = "Date d'obtention, null si pas encore gagné") Instant awardedAt,
            @Schema(requiredMode = REQUIRED, example = "3", description = "Avancement, plafonné à target") int progress,
            @Schema(requiredMode = REQUIRED, example = "10") int target) {
    }
}
