package dev.zetsu.config;

import dev.zetsu.common.ApiError;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI zetsuOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Zetsu API")
                        .version("v1")
                        .description("""
                                API de Zetsu. Session par cookie (JSESSIONID, HttpOnly) et jeton CSRF : \
                                lire le cookie XSRF-TOKEN (ou GET /api/v1/auth/csrf) et le renvoyer dans \
                                l'en-tête X-XSRF-TOKEN sur chaque POST, PUT, PATCH et DELETE. \
                                Toutes les erreurs ont la forme ApiError."""))
                .components(new Components()
                        .addSecuritySchemes("session", new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("JSESSIONID")))
                .addSecurityItem(new SecurityRequirement().addList("session"));
    }

    /**
     * Identifiants d'opération stables, de la forme {@code questionList} ou {@code jobAdminDecide} : sans cela,
     * springdoc numérote les méthodes homonymes ({@code update_2}) et la numérotation change à chaque nouveau
     * contrôleur, ce qui casse les types générés côté front.
     */
    @Bean
    OperationCustomizer stableOperationIds() {
        return (operation, handler) -> {
            String controller = handler.getBeanType().getSimpleName().replaceFirst("Controller$", "");
            String method = handler.getMethod().getName();
            operation.setOperationId(Character.toLowerCase(controller.charAt(0)) + controller.substring(1)
                    + Character.toUpperCase(method.charAt(0)) + method.substring(1));
            return operation;
        };
    }

    /** La déconnexion est gérée par un filtre Spring Security : on la documente à la main. */
    @Bean
    OpenApiCustomizer logoutEndpoint() {
        return openApi -> {
            ModelConverters.getInstance().readAll(ApiError.class).forEach(openApi.getComponents()::addSchemas);
            Content error = new Content().addMediaType("application/json",
                    new MediaType().schema(new Schema<>().$ref("#/components/schemas/ApiError")));
            Operation logout = new Operation()
                    .addTagsItem("auth")
                    .summary("Déconnexion")
                    .operationId("authLogout")
                    .responses(new ApiResponses()
                            .addApiResponse("204", new ApiResponse().description("Session fermée"))
                            .addApiResponse("403", new ApiResponse().description("CSRF_INVALID").content(error)));
            openApi.getPaths().addPathItem("/api/v1/auth/logout", new PathItem().post(logout));
        };
    }
}
