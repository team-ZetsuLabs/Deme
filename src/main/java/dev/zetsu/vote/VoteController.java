package dev.zetsu.vote;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.vote.VoteDtos.VoteRequest;
import dev.zetsu.vote.VoteDtos.VoteResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "votes", description = "Votes +1 / -1 sur les questions et les réponses")
public class VoteController {

    private final VoteService voteService;
    private final RateLimiter rateLimiter;

    public VoteController(VoteService voteService, RateLimiter rateLimiter) {
        this.voteService = voteService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/questions/{questionId}/votes")
    @Operation(summary = "Voter pour une question", description = "Voter l'inverse de son vote actuel le remplace.")
    @VoteErrors
    public VoteResult voteQuestion(@PathVariable Long questionId, @Valid @RequestBody VoteRequest req,
                                   @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.VOTE, "user:" + me.id());
        return voteService.voteQuestion(questionId, req.value(), me);
    }

    @DeleteMapping("/questions/{questionId}/votes")
    @Operation(summary = "Retirer son vote sur une question")
    @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND, VOTE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public VoteResult unvoteQuestion(@PathVariable Long questionId, @AuthenticationPrincipal ZetsuPrincipal me) {
        return voteService.unvoteQuestion(questionId, me);
    }

    @PostMapping("/answers/{answerId}/votes")
    @Operation(summary = "Voter pour une réponse", description = "Voter l'inverse de son vote actuel le remplace.")
    @VoteErrors
    public VoteResult voteAnswer(@PathVariable Long answerId, @Valid @RequestBody VoteRequest req,
                                 @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.VOTE, "user:" + me.id());
        return voteService.voteAnswer(answerId, req.value(), me);
    }

    @DeleteMapping("/answers/{answerId}/votes")
    @Operation(summary = "Retirer son vote sur une réponse")
    @ApiResponse(responseCode = "404", description = "ANSWER_NOT_FOUND, VOTE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public VoteResult unvoteAnswer(@PathVariable Long answerId, @AuthenticationPrincipal ZetsuPrincipal me) {
        return voteService.unvoteAnswer(answerId, me);
    }

    @java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
    @java.lang.annotation.Target(java.lang.annotation.ElementType.METHOD)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Vote enregistré"),
            @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_VOTE", content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "403", description = "CANNOT_VOTE_OWN_CONTENT", content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "404", description = "QUESTION_NOT_FOUND, ANSWER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "409", description = "ALREADY_VOTED", content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @interface VoteErrors {
    }
}
