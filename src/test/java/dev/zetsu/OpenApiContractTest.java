package dev.zetsu;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Vérifie que le contrat OpenAPI se génère. Avec {@code -DexportOpenApi=true}, l'écrit aussi dans
 * {@code docs/openapi.json} (à pousser avec chaque changement de contrat) :
 * {@code ./mvnw test -Dtest=OpenApiContractTest -DexportOpenApi=true}
 */
class OpenApiContractTest extends IntegrationTest {

    @Test
    void contratDisponible() throws Exception {
        var result = mvc.perform(get("/api/v1/openapi.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/questions'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/auth/logout'].post").exists())
                .andExpect(jsonPath("$.components.schemas.ApiError").exists())
                .andReturn();

        mvc.perform(get("/api/v1/swagger-ui/index.html")).andExpect(status().isOk());

        if (Boolean.getBoolean("exportOpenApi")) {
            Object tree = json.readValue(result.getResponse().getContentAsString(StandardCharsets.UTF_8), Object.class);
            Path out = Path.of("docs", "openapi.json");
            Files.createDirectories(out.getParent());
            Files.writeString(out, json.writerWithDefaultPrettyPrinter().writeValueAsString(tree) + "\n",
                    StandardCharsets.UTF_8);
        }
    }
}
