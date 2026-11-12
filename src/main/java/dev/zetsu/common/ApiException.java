package dev.zetsu.common;

import org.springframework.http.HttpStatus;

import java.util.Map;

/** Erreur métier traduite telle quelle en réponse {@link ApiError}. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fields;

    public ApiException(HttpStatus status, String code, String message) {
        this(status, code, message, null);
    }

    private ApiException(HttpStatus status, String code, String message, Map<String, String> fields) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields;
    }

    /** Même forme qu'une erreur de validation des DTO, pour un champ vérifié à la main (formulaire multipart). */
    public static ApiException invalidField(String field, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Certains champs sont invalides",
                Map.of(field, message));
    }

    /** Plusieurs champs vérifiés à la main (règles qui dépendent d'un autre champ). */
    public static ApiException invalidFields(Map<String, String> fields) {
        return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Certains champs sont invalides",
                Map.copyOf(fields));
    }

    public Map<String, String> fields() {
        return fields;
    }

    public HttpStatus status() {
        return status;
    }

    public String code() {
        return code;
    }

    public static ApiException notFound(String code, String message) {
        return new ApiException(HttpStatus.NOT_FOUND, code, message);
    }

    public static ApiException forbidden(String code, String message) {
        return new ApiException(HttpStatus.FORBIDDEN, code, message);
    }

    public static ApiException conflict(String code, String message) {
        return new ApiException(HttpStatus.CONFLICT, code, message);
    }

    public static ApiException badRequest(String code, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, code, message);
    }

    /** Point d'entrée publié dans le contrat mais pas encore codé : les fronts utilisent les mocks en attendant. */
    public static ApiException notImplemented() {
        return new ApiException(HttpStatus.NOT_IMPLEMENTED, "NOT_IMPLEMENTED",
                "Point d'entrée publié dans le contrat, pas encore disponible");
    }
}
