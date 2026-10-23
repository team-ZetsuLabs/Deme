package dev.zetsu.user;

import dev.zetsu.reputation.Level;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class UserAdminDtos {

    private UserAdminDtos() {
    }

    /** Un compte vu par l'équipe (MOD-4), avec l'email et le statut. */
    @Schema(name = "AdminUser")
    public record AdminUser(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED, example = "kofi_mensah") String username,
            @Schema(requiredMode = REQUIRED, example = "Kofi Mensah") String displayName,
            @Schema(description = "Null pour un compte supprimé (AUTH-6)", example = "kofi@exemple.gh") String email,
            String avatarUrl,
            @Schema(example = "GH") String countryCode,
            @Schema(requiredMode = REQUIRED) Role role,
            @Schema(requiredMode = REQUIRED) UserStatus status,
            @Schema(requiredMode = REQUIRED) int reputation,
            @Schema(requiredMode = REQUIRED) Level level,
            @Schema(requiredMode = REQUIRED, description = "Contenus de ce membre actuellement masqués", example = "0")
            long hiddenContentCount,
            @Schema(requiredMode = REQUIRED, description = "Avertissements reçus de l'équipe", example = "0")
            long warningCount,
            @Schema(description = "Motif de la suspension en cours") String suspensionReason,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    @Schema(name = "SuspendRequest", description = "Suspension d'un compte : ses sessions ouvertes sont fermées")
    public record SuspendRequest(
            @NotBlank(message = "Obligatoire") @Size(max = 500, message = "500 caractères maximum")
            @Schema(requiredMode = REQUIRED, example = "Offres frauduleuses répétées malgré un avertissement")
            String reason) {
    }

    @Schema(name = "RoleChangeRequest", description = "Changement de rôle, par un Administrateur seulement")
    public record RoleChangeRequest(
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) Role role) {
    }
}
