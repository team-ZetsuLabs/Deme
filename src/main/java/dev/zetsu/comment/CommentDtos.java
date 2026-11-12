package dev.zetsu.comment;

import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class CommentDtos {

    private CommentDtos() {
    }

    @Schema(name = "CommentRequest", description = "Commentaire sous une question ou une réponse (QA-9)")
    public record CommentRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 2, max = 1000, message = "Entre 2 et 1000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.",
                    example = "Tu as essayé d'abord avec la sandbox Orange Money ?")
            String body) {
    }

    @Schema(name = "Comment")
    public record CommentView(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String bodyHtml,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED,
                    description = "Vrai si le membre connecté peut supprimer le commentaire : le sien, ou l'équipe")
            boolean canDelete) {
    }
}
