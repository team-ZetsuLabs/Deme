package dev.zetsu.answer;

import dev.zetsu.answer.AnswerDtos.AnswerView;
import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.question.QuestionDtos.QuestionDetail;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "answers", description = "Réponses aux questions et réponse acceptée")
public class AnswerController {

    private final AnswerService answerService;
    private final RateLimiter rateLimiter;

    public AnswerController(AnswerService answerService, RateLimiter rateLimiter) {
        this.answerService = answerService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/questions/{questionId}/answers")
    @Operation(summary = "Réponses d'une question", description = "Réponse acceptée en tête, puis par score.")
    @ApiResponse(responseCode = "200", description = "Page de réponses")
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AnswerView> list(@PathVariable Long questionId,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size,
                                         @AuthenticationPrincipal ZetsuPrincipal me) {
        return answerService.list(questionId, page, size, me);
    }

    @PostMapping("/questions/{questionId}/answers")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Répondre à une question")
    @ApiResponse(responseCode = "201", description = "Réponse publiée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AnswerView create(@PathVariable Long questionId, @Valid @RequestBody AnswerDtos.AnswerRequest req,
                             @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return answerService.create(questionId, req, me);
    }

    @PutMapping("/answers/{answerId}")
    @Operation(summary = "Modifier sa réponse")
    @ApiResponse(responseCode = "200", description = "Réponse modifiée")
    @ApiResponse(responseCode = "403", description = "NOT_ANSWER_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "ANSWER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AnswerView update(@PathVariable Long answerId, @Valid @RequestBody AnswerDtos.AnswerRequest req,
                             @AuthenticationPrincipal ZetsuPrincipal me) {
        return answerService.update(answerId, req, me);
    }

    @PutMapping("/questions/{questionId}/accepted-answer")
    @Operation(summary = "Accepter une réponse (auteur de la question seulement)")
    @ApiResponse(responseCode = "200", description = "Question à jour")
    @ApiResponse(responseCode = "400", description = "ANSWER_NOT_IN_QUESTION", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "NOT_QUESTION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND, ANSWER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public QuestionDetail accept(@PathVariable Long questionId, @Valid @RequestBody AnswerDtos.AcceptAnswerRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        return answerService.accept(questionId, req.answerId(), me);
    }

    @DeleteMapping("/questions/{questionId}/accepted-answer")
    @Operation(summary = "Retirer l'acceptation (auteur de la question seulement)")
    @ApiResponse(responseCode = "200", description = "Question à jour")
    @ApiResponse(responseCode = "403", description = "NOT_QUESTION_AUTHOR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public QuestionDetail unaccept(@PathVariable Long questionId, @AuthenticationPrincipal ZetsuPrincipal me) {
        return answerService.accept(questionId, null, me);
    }
}
