package dev.zetsu.user;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.reputation.ReputationDtos.ReputationEntry;
import dev.zetsu.user.UserDtos.Me;
import dev.zetsu.user.UserDtos.OnboardingRequest;
import dev.zetsu.user.UserDtos.PublicProfile;
import dev.zetsu.user.UserDtos.UpdateProfileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "users", description = "Profils des membres")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{username}")
    @Operation(summary = "Profil public d'un membre")
    @ApiResponse(responseCode = "200", description = "Le profil")
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PublicProfile profile(@PathVariable String username) {
        return userService.profile(username);
    }

    @GetMapping("/{username}/reputation")
    @Operation(summary = "Historique de réputation d'un membre")
    @ApiResponse(responseCode = "200", description = "Page d'événements, du plus récent au plus ancien")
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<ReputationEntry> reputation(@PathVariable String username,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        return userService.reputationHistory(username, page, size);
    }

    @PutMapping("/me")
    @Operation(summary = "Modifier son profil")
    @ApiResponse(responseCode = "200", description = "Profil à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me update(@Valid @RequestBody UpdateProfileRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        return userService.update(me.id(), req);
    }

    @PutMapping("/me/onboarding")
    @Operation(summary = "Terminer le parcours d'accueil",
            description = "Stack (1 à 10 technologies, partagées avec les étiquettes), pays et langue (AUTH-5). "
                    + "Passe onboardingCompleted à vrai ; peut être rappelé pour corriger ses choix.")
    @ApiResponse(responseCode = "200", description = "Profil à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, TAG_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me onboarding(@Valid @RequestBody OnboardingRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        return userService.completeOnboarding(me.id(), req);
    }
}
