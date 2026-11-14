package dev.zetsu.auth;

import dev.zetsu.common.CountryCode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class AuthDtos {

    private AuthDtos() {
    }

    /** AUTH-1 : nom, email, pays, mot de passe de 8 caractères minimum avec un chiffre. */
    @Schema(name = "RegisterRequest")
    public record RegisterRequest(
            @NotBlank(message = "Obligatoire") @Size(max = 80, message = "80 caractères maximum")
            @Schema(requiredMode = REQUIRED, example = "Kofi Mensah") String displayName,

            @NotBlank(message = "Obligatoire") @Email(message = "Email invalide")
            @Size(max = 254, message = "254 caractères maximum")
            @Schema(requiredMode = REQUIRED, example = "kofi.mensah@exemple.gh") String email,

            @NotBlank(message = "Obligatoire") @CountryCode
            @Schema(requiredMode = REQUIRED, example = "GH") String countryCode,

            @NotBlank(message = "Obligatoire")
            @Pattern(regexp = "^(?=.*\\d).{8,72}$", message = "8 caractères minimum, dont un chiffre")
            @Schema(requiredMode = REQUIRED, example = "accra2026") String password) {
    }

    /** SET-4 : un fournisseur OAuth activé sur ce serveur, lié ou non au compte du membre. */
    @Schema(name = "ConnectedAccount")
    public record ConnectedAccount(
            @Schema(requiredMode = REQUIRED, allowableValues = {"github", "google"}) String provider,
            @Schema(requiredMode = REQUIRED) boolean linked,
            @Schema(description = "Null si non lié") Instant linkedAt,
            @Schema(requiredMode = REQUIRED, description = "Faux si c'est le dernier moyen de connexion du compte")
            boolean canUnlink) {
    }

    @Schema(name = "Connections")
    public record Connections(
            @Schema(requiredMode = REQUIRED, description = "Un élément par fournisseur activé") List<ConnectedAccount> accounts,
            @Schema(requiredMode = REQUIRED, description = "Le compte a un mot de passe (inscription par email)")
            boolean hasPassword) {
    }

    @Schema(name = "LinkStart", description = "Adresse vers laquelle naviguer (pas de fetch) pour lier le compte")
    public record LinkStart(
            @Schema(requiredMode = REQUIRED, example = "/api/v1/auth/oauth2/authorization/github") String authorizationUrl) {
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
