package dev.zetsu.challenge;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.challenge.ChallengeDtos.Challenge;
import dev.zetsu.challenge.ChallengeDtos.LeaderboardEntry;
import dev.zetsu.challenge.ChallengeDtos.MySubmission;
import dev.zetsu.challenge.ChallengeDtos.SubmissionRequest;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Contrat du sprint 3 : défis (CH-1 à CH-3). Lecture publique, dépôt avec une session. */
@RestController
@RequestMapping("/api/v1/challenges")
@Tag(name = "challenges", description = "Défis, dépôts et classement")
public class ChallengeController {

    @GetMapping("/current")
    @Operation(summary = "Défi en cours (CH-1)",
            description = "Le défi « OPEN » ; à défaut, le dernier défi « CLOSED », pour garder son classement visible.")
    @ApiResponse(responseCode = "200", description = "Le défi")
    @ApiResponse(responseCode = "404", description = "NO_CURRENT_CHALLENGE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Challenge current(@AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Un défi", description = "Les défis « UPCOMING » ne sont visibles que dans le back office.")
    @ApiResponse(responseCode = "200", description = "Le défi")
    @ApiResponse(responseCode = "404", description = "CHALLENGE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Challenge get(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/{id}/submissions")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Déposer son dépôt GitHub (CH-2)",
            description = "Un dépôt par membre et par défi, tant que le défi est « OPEN ». Seul le format de l'adresse "
                    + "est vérifié ; l'équipe ouvre le dépôt en notant.")
    @ApiResponse(responseCode = "201", description = "Dépôt enregistré")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "CHALLENGE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "ALREADY_SUBMITTED, CHALLENGE_NOT_OPEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MySubmission submit(@PathVariable Long id, @Valid @RequestBody SubmissionRequest req,
                               @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @GetMapping("/{id}/leaderboard")
    @Operation(summary = "Classement d'un défi (CH-1)",
            description = "Dépôts validés seulement, meilleure note d'abord, puis le dépôt le plus ancien. "
                    + "Vide tant que rien n'est noté.")
    @ApiResponse(responseCode = "200", description = "Page du classement")
    @ApiResponse(responseCode = "404", description = "CHALLENGE_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<LeaderboardEntry> leaderboard(@PathVariable Long id,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "20") int size) {
        throw ApiException.notImplemented();
    }
}
