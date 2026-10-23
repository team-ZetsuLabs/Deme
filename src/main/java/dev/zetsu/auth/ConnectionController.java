package dev.zetsu.auth;

import dev.zetsu.auth.AuthDtos.Connections;
import dev.zetsu.auth.AuthDtos.LinkStart;
import dev.zetsu.common.ApiError;
import dev.zetsu.common.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Contrat du sprint 3 (SET-4) : lier ou délier GitHub et Google depuis les paramètres. */
@RestController
@RequestMapping("/api/v1/users/me/connections")
@Tag(name = "users", description = "Profils des membres")
public class ConnectionController {

    @GetMapping
    @Operation(summary = "Mes comptes connectés", description = "Un élément par fournisseur activé sur ce serveur.")
    @ApiResponse(responseCode = "200", description = "Les comptes")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Connections list(@AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @PostMapping("/{provider}")
    @Operation(summary = "Commencer la liaison d'un compte",
            description = "Note dans la session que la prochaine connexion OAuth doit être liée au membre connecté, "
                    + "puis renvoie l'adresse vers laquelle naviguer. Au retour, le serveur renvoie vers "
                    + "FRONT_URL/settings?linked=github, ou ?linkError=ALREADY_LINKED_ELSEWHERE si ce compte GitHub ou "
                    + "Google appartient déjà à un autre membre.")
    @ApiResponse(responseCode = "200", description = "Adresse d'autorisation")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROVIDER_NOT_FOUND", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "ALREADY_LINKED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public LinkStart link(@PathVariable String provider, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }

    @DeleteMapping("/{provider}")
    @Operation(summary = "Délier un compte",
            description = "Refusé si c'est le dernier moyen de connexion (pas de mot de passe, aucun autre compte lié).")
    @ApiResponse(responseCode = "200", description = "Comptes à jour")
    @ApiResponse(responseCode = "401", description = "UNAUTHENTICATED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "PROVIDER_NOT_FOUND, NOT_LINKED", content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "LAST_LOGIN_METHOD", content = @Content(schema = @Schema(implementation = ApiError.class)))
    public Connections unlink(@PathVariable String provider, @AuthenticationPrincipal ZetsuPrincipal me) {
        throw ApiException.notImplemented();
    }
}
