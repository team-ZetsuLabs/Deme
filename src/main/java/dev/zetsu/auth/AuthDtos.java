package dev.zetsu.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class AuthDtos {

    private AuthDtos() {
    }

    @Schema(name = "RegisterRequest")
    public record RegisterRequest(
            @NotBlank(message = "Obligatoire") @Email(message = "Email invalide")
            @Size(max = 254, message = "254 caractères maximum")
            @Schema(requiredMode = REQUIRED, example = "kofi.mensah@exemple.gh") String email,

            @NotBlank(message = "Obligatoire") @Size(min = 10, max = 72, message = "Entre 10 et 72 caractères")
            @Schema(requiredMode = REQUIRED, example = "un-mot-de-passe-long") String password,

            @NotBlank(message = "Obligatoire")
            @Pattern(regexp = "^[A-Za-z0-9_]{3,30}$", message = "3 à 30 lettres, chiffres ou _")
            @Schema(requiredMode = REQUIRED, example = "kofi_dev") String username,

            @NotBlank(message = "Obligatoire") @Size(max = 80, message = "80 caractères maximum")
            @Schema(requiredMode = REQUIRED, example = "Kofi Mensah") String displayName) {
    }

    @Schema(name = "LoginRequest")
    public record LoginRequest(
            @NotBlank(message = "Obligatoire") @Schema(requiredMode = REQUIRED) String email,
            @NotBlank(message = "Obligatoire") @Schema(requiredMode = REQUIRED) String password) {
    }

    @Schema(name = "CsrfToken", description = "À renvoyer dans l'en-tête headerName sur chaque POST, PUT, PATCH, DELETE. "
            + "Le même jeton est aussi posé dans le cookie XSRF-TOKEN.")
    public record CsrfTokenResponse(
            @Schema(requiredMode = REQUIRED, example = "X-XSRF-TOKEN") String headerName,
            @Schema(requiredMode = REQUIRED) String token) {
    }

    @Schema(name = "AuthProvider")
    public record Provider(
            @Schema(requiredMode = REQUIRED, example = "github") String id,
            @Schema(requiredMode = REQUIRED, example = "/api/v1/auth/oauth2/authorization/github",
                    description = "Adresse vers laquelle naviguer (pas un appel fetch) pour lancer la connexion")
            String authorizationUrl) {
    }

    @Schema(name = "AuthProviders")
    public record Providers(@Schema(requiredMode = REQUIRED) List<Provider> providers) {
    }
}
