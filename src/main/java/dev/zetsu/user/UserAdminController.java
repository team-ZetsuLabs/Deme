package dev.zetsu.user;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.user.UserAdminDtos.AdminUser;
import dev.zetsu.user.UserAdminDtos.RoleChangeRequest;
import dev.zetsu.user.UserAdminDtos.SuspendRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Back office (MOD-4) : rechercher, suspendre, réactiver un compte, changer son rôle. */
@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "admin", description = "Back office de l'équipe (Modérateur, Administrateur)")
public class UserAdminController {

    @GetMapping
    @Operation(summary = "Rechercher des comptes",
            description = "q cherche dans le pseudo, le nom et l'email. Les plus récents d'abord.")
    @ApiResponse(responseCode = "200", description = "Page de comptes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<AdminUser> list(@RequestParam(required = false) String q,
                                        @RequestParam(required = false) UserStatus status,
                                        @RequestParam(required = false) Role role,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspendre un compte",
            description = "Appliqué côté serveur : connexion refusée (ACCOUNT_SUSPENDED) et sessions ouvertes fermées "
                    + "à la requête suivante. Ses contenus restent visibles. Impossible sur soi-même ou sur un "
                    + "membre de l'équipe.")
    @ApiResponse(responseCode = "200", description = "Compte suspendu")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN, CANNOT_SUSPEND_STAFF", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "USER_NOT_ACTIVE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminUser suspend(@PathVariable Long id, @Valid @RequestBody SuspendRequest req,
                             @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/{id}/reactivate")
    @Operation(summary = "Réactiver un compte suspendu")
    @ApiResponse(responseCode = "200", description = "Compte actif")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "USER_NOT_SUSPENDED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminUser reactivate(@PathVariable Long id, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Changer le rôle d'un compte",
            description = "Administrateur seulement. Pris en compte à la prochaine requête du membre. Un "
                    + "Administrateur ne peut pas retirer son propre rôle.")
    @ApiResponse(responseCode = "200", description = "Rôle changé")
    @ApiResponse(responseCode = "400", description = "VALIDATION_ERROR", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "FORBIDDEN, CANNOT_CHANGE_OWN_ROLE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "USER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "USER_NOT_ACTIVE", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AdminUser changeRole(@PathVariable Long id, @Valid @RequestBody RoleChangeRequest req,
                                @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }
}
