package dev.zetsu.vote;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class VoteDtos {

    private VoteDtos() {
    }

    @Schema(name = "VoteRequest")
    public record VoteRequest(
            @NotNull(message = "Obligatoire")
            @Schema(requiredMode = REQUIRED, allowableValues = {"1", "-1"}, example = "1") Integer value) {
    }

    @Schema(name = "VoteResult")
    public record VoteResult(
            @Schema(requiredMode = REQUIRED, description = "Nouveau score du contenu") int score,
            @Schema(description = "Vote du membre après l'opération : 1, -1 ou null") Integer myVote) {
    }
}
