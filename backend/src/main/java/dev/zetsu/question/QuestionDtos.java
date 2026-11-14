package dev.zetsu.question;

import dev.zetsu.comment.CommentDtos.CommentView;
import dev.zetsu.common.CountryCode;
import dev.zetsu.user.UserDtos.AuthorSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class QuestionDtos {

    private QuestionDtos() {
    }

    /** Contexte africain de la question (QA-2) : facultatif mais encouragé, affiché et filtrable. */
    @Schema(name = "QuestionContext")
    public record QuestionContext(
            @CountryCode @Schema(example = "CI", description = "Code pays ISO 3166-1 alpha-2") String countryCode,
            MobileMoneyOperator mobileMoneyOperator,
            NetworkQuality networkQuality,
            @Size(max = 60, message = "60 caractères maximum")
            @Schema(example = "Spring Boot 3.3", description = "Version de la techno concernée") String techVersion) {

        static QuestionContext from(Question q) {
            return new QuestionContext(q.getCountryCode(), q.getMobileMoneyOperator(), q.getNetworkQuality(),
                    q.getTechVersion());
        }
    }

    @Schema(name = "QuestionRequest", description = "Création ou modification complète d'une question (QA-1)")
    public record QuestionRequest(
            @NotBlank(message = "Obligatoire") @Size(min = 15, max = 150, message = "Entre 15 et 150 caractères")
            @Schema(requiredMode = REQUIRED, example = "Comment vérifier un paiement Orange Money côté serveur ?")
            String title,

            @NotBlank(message = "Obligatoire") @Size(min = 30, max = 30000, message = "Entre 30 et 30000 caractères")
            @Schema(requiredMode = REQUIRED, description = "Markdown. Le HTML brut est ignoré.")
            String body,

            @Size(max = 20000, message = "20000 caractères maximum")
            @Schema(description = "Code facultatif, en texte brut") String code,

            @NotNull(message = "Obligatoire") @Size(min = 1, max = 4, message = "Entre 1 et 4 étiquettes")
            @Schema(requiredMode = REQUIRED, example = "[\"mobile-money\", \"spring-boot\"]")
            List<String> tags,

            @Valid QuestionContext context,

            @Size(max = 2, message = "2 images maximum")
            @Schema(description = "Images envoyées avant par POST /questions/images, dans l'ordre d'affichage (2 au "
                    + "plus). Absent : les images ne changent pas ; [] : toutes retirées.",
                    example = "[\"3f2b6c1e-8d4a-4c55-9a51-0b7e2f1d9c3a\"]")
            List<String> imageIds) {
    }

    @Schema(name = "QuestionImage", description = "Image jointe à une question (QA-11)")
    public record QuestionImageView(
            @Schema(requiredMode = REQUIRED, example = "3f2b6c1e-8d4a-4c55-9a51-0b7e2f1d9c3a") String id,
            @Schema(requiredMode = REQUIRED, description = "Adresse de l'image, à afficher telle quelle dans <img>")
            String url) {
    }

    @Schema(name = "QuestionImageForm", description = "Formulaire multipart d'une image de question (QA-11)")
    public record QuestionImageForm(
            @Schema(requiredMode = REQUIRED, type = "string", format = "binary",
                    description = "PNG, JPG ou WebP, 2 Mo maximum") String image) {
    }

    @Schema(name = "QuestionSummary", description = "Question telle qu'affichée dans une liste")
    public record QuestionSummary(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED, description = "Début du texte, sans mise en forme (200 caractères)")
            String excerpt,
            @Schema(requiredMode = REQUIRED) List<String> tags,
            @Schema(requiredMode = REQUIRED) QuestionContext context,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED) int score,
            @Schema(requiredMode = REQUIRED) int answerCount,
            @Schema(requiredMode = REQUIRED, description = "Vrai si une réponse est acceptée (question résolue)")
            boolean hasAcceptedAnswer,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "QuestionDetail")
    public record QuestionDetail(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED, description = "Markdown d'origine, pour pré-remplir le formulaire d'édition")
            String bodyMarkdown,
            @Schema(requiredMode = REQUIRED, description = "HTML nettoyé côté serveur, à afficher avec MemberContent")
            String bodyHtml,
            @Schema(description = "Code en texte brut, à afficher échappé puis colorer côté client") String code,
            @Schema(requiredMode = REQUIRED) List<String> tags,
            @Schema(requiredMode = REQUIRED) QuestionContext context,
            @Schema(requiredMode = REQUIRED) AuthorSummary author,
            @Schema(requiredMode = REQUIRED) int score,
            @Schema(requiredMode = REQUIRED) int answerCount,
            Long acceptedAnswerId,
            @Schema(description = "Vote du membre connecté : 1, -1, ou null s'il n'a pas voté ou n'est pas connecté")
            Integer myVote,
            @Schema(requiredMode = REQUIRED, description = "Vrai si le membre connecté peut modifier la question")
            boolean canEdit,
            @Schema(requiredMode = REQUIRED) Instant createdAt,
            @Schema(requiredMode = REQUIRED) Instant updatedAt,
            @Schema(requiredMode = REQUIRED,
                    description = "Vrai si le membre connecté peut supprimer la question : la sienne, sans réponse")
            boolean canDelete,
            @Schema(requiredMode = REQUIRED, description = "Commentaires de la question (QA-9), du plus ancien au plus récent")
            List<CommentView> comments,
            @Schema(requiredMode = REQUIRED, description = "Images jointes (QA-11), 2 au plus, dans l'ordre choisi")
            List<QuestionImageView> images) {
    }

    @Schema(name = "SimilarQuestion", description = "Question proche du titre en cours de saisie (QA-8), version légère")
    public record SimilarQuestion(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED) String title,
            @Schema(requiredMode = REQUIRED) int score,
            @Schema(requiredMode = REQUIRED) int answerCount,
            @Schema(requiredMode = REQUIRED, description = "Vrai si une réponse est acceptée (question résolue)")
            boolean hasAcceptedAnswer) {
    }
}
