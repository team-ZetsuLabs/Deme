package dev.zetsu.challenge;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.challenge.ChallengeDtos.AdminSubmission;
import dev.zetsu.challenge.ChallengeDtos.Challenge;
import dev.zetsu.challenge.ChallengeDtos.ChallengeRequest;
import dev.zetsu.challenge.ChallengeDtos.SubmissionReviewRequest;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Back office (MOD-4, CH-3) : créer les défis et noter les dépôts. */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class ChallengeAdminController {

    @GetMapping("/challenges")
    @Operation(summary = "Tous les défis", description = "Les plus récents d'abord, « UPCOMING » compris.")
    @ApiResponse(responseCode = "200", description = "Page de défis")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<Challenge> list(@RequestParam(required = false) ChallengeStatus status,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/challenges")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Créer un défi",
            description = "endsAt après startsAt. Deux défis ne peuvent pas se chevaucher. Au début du défi, les "
                    + "membres sont notifiés (CHALLENGE_STARTED).")
    @ApiResponse(responseCode = "201", description = "Défi créé")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, INVALID_PERIOD", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "CHALLENGE_OVERLAP", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Challenge create(@Valid @RequestBody ChallengeRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PutMapping("/challenges/{id}")
    @Operation(summary = "Modifier un défi",
            description = "Tout est modifiable avant le début ; une fois commencé, seuls l'énoncé, les spécifications "
                    + "et la date de fin (repoussée) changent.")
    @ApiResponse(responseCode = "200", description = "Défi à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, INVALID_PERIOD", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "CHALLENGE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "CHALLENGE_OVERLAP, CHALLENGE_STARTED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Challenge update(@PathVariable Long id, @Valid @RequestBody ChallengeRequest req) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/challenges/{id}/submissions")
    @Operation(summary = "Dépôts d'un défi", description = "Par défaut ceux à noter (« PENDING »), les plus anciens d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de dépôts")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "CHALLENGE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AdminSubmission> submissions(@PathVariable Long id,
                                                     @RequestParam(defaultValue = "PENDING") SubmissionStatus status,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "20") int size) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/submissions/{id}/review")
    @Operation(summary = "Noter un dépôt (CH-3)",
            description = "Note sur 100 et validation. Un dépôt validé rapporte +20 de réputation (CHALLENGE_VALIDATED), "
                    + "une seule fois ; une note corrigée plus tard ne change pas les points, un passage de VALIDATED "
                    + "à REJECTED les retire. Le membre est notifié.")
    @ApiResponse(responseCode = "200", description = "Dépôt noté")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "SUBMISSION_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminSubmission review(@PathVariable Long id, @Valid @RequestBody SubmissionReviewRequest req,
                                  @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }
}
