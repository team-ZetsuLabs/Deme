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
}
