package dev.zetsu.answer;

import dev.zetsu.comment.CommentDtos.CommentView;
import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class AnswerDtos {

    private AnswerDtos() {
    }

    @Schema(name = "AnswerRequest")
    public record AnswerRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 20, max = 30000, message = "Entre 20 et 30000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.") String body,
            @Size(max = 20000, message = "20000 caractères maximum")
            @Schema(description = "Code facultatif, en texte brut") String code) {
    }

    @Schema(name = "AcceptAnswerRequest")
    public record AcceptAnswerRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) Long answerId) {
    }

    @Schema(name = "Answer")
    public record AnswerView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) Long questionId,
            @Schema(requiredMode = REQUIRED) String bodyMarkdown,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String bodyHtml,
            @Schema(description = "Code en texte brut, à afficher échappé puis colorer côté client") String code,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED) int score,
            @Schema(requiredMode = REQUIRED) boolean accepted,
            @Schema(requiredMode = REQUIRED,
                    description = "Vrai si l'auteur de la réponse est du même pays que la question (QA-10)")
            boolean sameContext,
            Integer myVote,
            @Schema(requiredMode = REQUIRED) boolean canEdit,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt,
            @Schema(requiredMode = REQUIRED, description = "Commentaires de la réponse (QA-9), du plus ancien au plus récent")
            List<CommentView> comments) {
    }
}
