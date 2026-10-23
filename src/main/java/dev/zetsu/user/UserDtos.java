package dev.zetsu.user;

import dev.zetsu.common.CountryCode;
import dev.zetsu.reputation.Level;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

public final class UserDtos {

    private UserDtos() {
    }

    /** Le membre connecté, avec ses informations privées (email, réglages). */
    @Schema(name = "Me")
    public record Me(
            @Schema(requiredMode = REQUIRED) Long id,
            @Schema(requiredMode = REQUIRED, example = "aminata_diallo") String username,
            @Schema(requiredMode = REQUIRED, example = "Aminata Diallo") String displayName,
            @Schema(example = "aminata@exemple.sn") String email,
            String avatarUrl,
            String bio,
            @Schema(example = "SN") String countryCode,
            @Schema(example = "Dakar") String city,
            @Schema(requiredMode = REQUIRED, allowableValues = {"fr", "en"}) String language,
            @Schema(requiredMode = REQUIRED, description = "Profil visible par les recruteurs (désactivé par défaut)")
            boolean visibleToRecruiters,
            @Schema(requiredMode = REQUIRED) Role role,
            @Schema(requiredMode = REQUIRED) int reputation,
            @Schema(requiredMode = REQUIRED) Level level,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {

        public static Me from(User u, Level level) {
            return new Me(u.getId(), u.getUsername(), u.getDisplayName(), u.getEmail(), u.getAvatarUrl(),
                    u.getBio(), u.getCountryCode(), u.getCity(), u.getLanguage(), u.isVisibleToRecruiters(),
                    u.getRole(), u.getReputation(), level, u.getCreatedAt());
        }
    }

    /** Profil public d'un membre. */
    @Schema(name = "PublicProfile")
    public record PublicProfile(
            @Schema(requiredMode = REQUIRED) String username,
            @Schema(requiredMode = REQUIRED) String displayName,
            String avatarUrl,
            String bio,
            String countryCode,
            String city,
            @Schema(requiredMode = REQUIRED) Role role,
            @Schema(requiredMode = REQUIRED) int reputation,
            @Schema(requiredMode = REQUIRED) Level level,
            @Schema(requiredMode = REQUIRED) boolean visibleToRecruiters,
            @Schema(requiredMode = REQUIRED) long questionCount,
            @Schema(requiredMode = REQUIRED) long answerCount,
            @Schema(requiredMode = REQUIRED) Instant createdAt) {
    }

    /** Auteur affiché à côté d'une question ou d'une réponse. */
    @Schema(name = "AuthorSummary")
    public record AuthorSummary(
            @Schema(requiredMode = REQUIRED) String username,
            @Schema(requiredMode = REQUIRED) String displayName,
            String avatarUrl,
            String countryCode,
            @Schema(requiredMode = REQUIRED) int reputation,
            @Schema(requiredMode = REQUIRED) Level level) {

        public static AuthorSummary from(User u, Level level) {
            return new AuthorSummary(u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getCountryCode(),
                    u.getReputation(), level);
        }
    }

    /** Modification du profil (SET-1, SET-3) : tous les champs sont remplacés (null efface un champ facultatif). */
    @Schema(name = "UpdateProfileRequest")
    public record UpdateProfileRequest(
            @NotBlank(message = "Obligatoire") @Size(max = 80, message = "80 caractères maximum")
            @Schema(requiredMode = REQUIRED) String displayName,
            @Size(max = 200, message = "200 caractères maximum") String bio,
            @CountryCode String countryCode,
            @Size(max = 80, message = "80 caractères maximum") String city,
            @NotNull(message = "Obligatoire") @Pattern(regexp = "^(fr|en)$", message = "fr ou en")
            @Schema(requiredMode = REQUIRED, allowableValues = {"fr", "en"}) String language,
            @NotNull(message = "Obligatoire") @Schema(requiredMode = REQUIRED) Boolean visibleToRecruiters) {
    }
}
