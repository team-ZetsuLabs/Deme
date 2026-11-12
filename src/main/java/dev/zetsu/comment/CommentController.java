package dev.zetsu.comment;

import dev.zetsu.answer.AnswerService;
import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.comment.CommentDtos.CommentRequest;
import dev.zetsu.comment.CommentDtos.CommentView;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.question.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "comments", description = "Commentaires sous les questions et les réponses (QA-9)")
public class CommentController {

    private final CommentService commentService;
    private final QuestionService questionService;
    private final AnswerService answerService;
    private final RateLimiter rateLimiter;

    public CommentController(CommentService commentService, QuestionService questionService,
                             AnswerService answerService, RateLimiter rateLimiter) {
        this.commentService = commentService;
        this.questionService = questionService;
        this.answerService = answerService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/questions/{questionId}/comments")
    @Operation(summary = "Commentaires d'une question",
            description = "Du plus ancien au plus récent. Déjà fournis dans QuestionDetail.comments.")
    @ApiResponse(responseCode = "200", description = "Liste des commentaires, éventuellement vide")
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<CommentView> listOnQuestion(@PathVariable Long questionId,
                                            @AuthenticationPrincipal ZetsuPrincipal me) {
        questionService.loadVisible(questionId, me);
        return commentService.forQuestion(questionId, me);
    }

    @GetMapping("/answers/{answerId}/comments")
    @Operation(summary = "Commentaires d'une réponse",
            description = "Du plus ancien au plus récent. Déjà fournis dans Answer.comments.")
    @ApiResponse(responseCode = "200", description = "Liste des commentaires, éventuellement vide")
    @ApiResponse(responseCode = "404", description = "ANSWER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<CommentView> listOnAnswer(@PathVariable Long answerId, @AuthenticationPrincipal ZetsuPrincipal me) {
        answerService.loadVisible(answerId, me);
        return commentService.forAnswers(List.of(answerId), me).get(answerId);
    }

    @PostMapping("/questions/{questionId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Commenter une question")
    @ApiResponse(responseCode = "201", description = "Commentaire publié")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CommentView commentQuestion(@PathVariable Long questionId, @Valid @RequestBody CommentRequest req,
                                       @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        questionService.loadVisible(questionId, me);
        return commentService.addToQuestion(questionId, req.body(), me);
    }

    @PostMapping("/answers/{answerId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Commenter une réponse")
    @ApiResponse(responseCode = "201", description = "Commentaire publié")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "ANSWER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CommentView commentAnswer(@PathVariable Long answerId, @Valid @RequestBody CommentRequest req,
                                     @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        answerService.loadVisible(answerId, me);
        return commentService.addToAnswer(answerId, req.body(), me);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer un commentaire", description = "Son auteur, ou un modérateur ou administrateur.")
    @ApiResponse(responseCode = "204", description = "Commentaire supprimé")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_COMMENT_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "COMMENT_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void delete(@PathVariable Long commentId, @AuthenticationPrincipal ZetsuPrincipal me) {
        commentService.delete(commentId, me);
    }
}
