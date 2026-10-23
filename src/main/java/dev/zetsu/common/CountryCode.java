package dev.zetsu.common;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Locale;
import java.util.Set;

/**
 * Code pays ISO 3166-1 alpha-2 en majuscules ({@code SN}, {@code CI}, {@code CM}…). Null ou vide accepté : l'obligation
 * relève de {@code @NotBlank}, sinon les deux messages se disputent le champ dans la réponse.
 */
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CountryCode.Validator.class)
public @interface CountryCode {

    String message() default "Code pays inconnu";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    Set<String> ISO_CODES = Set.of(Locale.getISOCountries());

    class Validator implements ConstraintValidator<CountryCode, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            return value == null || value.isBlank() || ISO_CODES.contains(value);
        }
    }
}
