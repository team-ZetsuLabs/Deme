package dev.zetsu.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

/**
 * Forme unique de toutes les erreurs de l'API. {@code code} est stable et sert au front pour traduire.
 * {@code fields} n'existe que pour les erreurs de validation.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(name = "ApiError")
public record ApiError(
        @Schema(example = "QUESTION_NOT_FOUND", requiredMode = Schema.RequiredMode.REQUIRED) String code,
        @Schema(example = "Question introuvable", requiredMode = Schema.RequiredMode.REQUIRED) String message,
        @Schema(example = "{\"title\": \"Obligatoire\"}") Map<String, String> fields) {

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, null);
    }
}
