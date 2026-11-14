package dev.zetsu.user;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.RateLimiter;
import dev.zetsu.reputation.ReputationDtos.BadgeProgress;
import dev.zetsu.reputation.ReputationDtos.ReputationEntry;
import dev.zetsu.user.UserDtos.AvatarForm;
import dev.zetsu.user.UserDtos.DeleteAccountRequest;
import dev.zetsu.user.UserDtos.Me;
import dev.zetsu.user.UserDtos.OnboardingRequest;
import dev.zetsu.user.UserDtos.PublicProfile;
import dev.zetsu.user.UserDtos.UpdateProfileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "users", description = "Profils des membres")
public class UserController {

    private final UserService userService;
    private final AvatarService avatarService;
    private final RateLimiter rateLimiter;

    public UserController(UserService userService, AvatarService avatarService, RateLimiter rateLimiter) {
        this.userService = userService;
        this.avatarService = avatarService;
        this.rateLimiter = rateLimiter;
    }

    @GetMapping("/{username}")
    @Operation(summary = "Profil public d'un membre")
    @ApiResponse(responseCode = "200", description = "Le profil")
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PublicProfile profile(@PathVariable String username, @AuthenticationPrincipal ZetsuPrincipal me) {
        return userService.profile(username, me);
    }

    @GetMapping("/{username}/badges")
    @Operation(summary = "Badges d'un membre et sa progression (REP-4)",
            description = "Toujours les six badges, dans le même ordre. Un badge gagné ne se perd pas.")
    @ApiResponse(responseCode = "200", description = "Les six badges")
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public List<BadgeProgress> badges(@PathVariable String username, @AuthenticationPrincipal ZetsuPrincipal me) {
        return userService.badges(username, me);
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
            description = "Stack (1 à 20 technologies, partagées avec les étiquettes), pays et langue (AUTH-5). "
                    + "Passe onboardingCompleted à vrai ; peut être rappelé pour corriger ses choix.")
    @ApiResponse(responseCode = "200", description = "Profil à jour")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, INVALID_TAG, TAG_REQUIRED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me onboarding(@Valid @RequestBody OnboardingRequest req, @AuthenticationPrincipal ZetsuPrincipal me) {
        return userService.completeOnboarding(me.id(), req);
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Changer sa photo de profil (SET-1)",
            description = "Formulaire multipart, champ photo : PNG, JPG ou WebP de 2 Mo maximum, vérifié par son "
                    + "contenu et pas par son nom. Stockée hors du dossier public sous un nom régénéré ; avatarUrl "
                    + "change à chaque nouvelle photo, on peut donc la garder en cache.")
    @ApiResponse(responseCode = "200", description = "Profil à jour, avatarUrl pointe vers la nouvelle photo")
    @ApiResponse(responseCode = "400", description = "PHOTO_REQUIRED, PHOTO_TYPE, PHOTO_TOO_LARGE, FILE_TOO_LARGE (plus de 5 Mo)", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "503", description = "STORAGE_UNAVAILABLE : Cloudinary injoignable, réessayer", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "429", description = "RATE_LIMITED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE, schema = @Schema(implementation = AvatarForm.class)))
    public Me updateAvatar(@Parameter(hidden = true) @RequestPart(required = false) MultipartFile photo,
                           @AuthenticationPrincipal ZetsuPrincipal me) {
        rateLimiter.check(RateLimiter.Rule.PUBLISH, "user:" + me.id());
        return avatarService.update(me.id(), photo);
    }

    @DeleteMapping("/me/avatar")
    @Operation(summary = "Retirer sa photo de profil", description = "Le front affiche alors les initiales.")
    @ApiResponse(responseCode = "200", description = "Profil à jour, avatarUrl à null")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Me deleteAvatar(@AuthenticationPrincipal ZetsuPrincipal me) {
        return avatarService.delete(me.id());
    }

    @GetMapping("/{username}/avatar/{file}")
    @Operation(summary = "Photo de profil d'un membre",
            description = "Ne pas construire cette adresse : utiliser avatarUrl. Réponse image/png, image/jpeg ou "
                    + "image/webp, en cache un an (le nom change avec la photo).")
    @ApiResponse(responseCode = "200", description = "L'image", content = {
            @Content(mediaType = "image/png"), @Content(mediaType = "image/jpeg"), @Content(mediaType = "image/webp")})
    @ApiResponse(responseCode = "404", description = "AVATAR_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Resource> avatar(@PathVariable String username, @PathVariable String file) {
        AvatarService.Image image = avatarService.load(username, file);
        return ResponseEntity.ok()
                .contentType(image.type())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(image.file());
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Supprimer son compte",
            description = "Le membre recopie son pseudo pour confirmer (AUTH-6). Ses questions et réponses restent, "
                    + "signées « Utilisateur supprimé » ; réputation, comptes liés et données personnelles sont effacés. "
                    + "La session est fermée.")
    @ApiResponse(responseCode = "204", description = "Compte supprimé, session fermée")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR, CONFIRMATION_MISMATCH", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void delete(@Valid @RequestBody DeleteAccountRequest req, @AuthenticationPrincipal ZetsuPrincipal me,
                       HttpServletRequest request, HttpServletResponse response) {
        userService.delete(me.id(), req);
        new SecurityContextLogoutHandler().logout(request, response, null);
    }
}
