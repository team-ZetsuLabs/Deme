package dev.zetsu.stats;

import com.fasterxml.jackson.databind.JsonNode;
import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Chiffres de la page d'accueil. La base est partagée entre les tests : on compare avant et après. */
class StatsIntegrationTest extends IntegrationTest {

    private JsonNode stats() throws Exception {
        return read(mvc.perform(get("/api/v1/stats")).andExpect(status().isOk()).andReturn());
    }

    @Test
    void lesChiffresSontPublicsEtMisEnCache() throws Exception {
        mvc.perform(get("/api/v1/stats"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=300, public"))
                .andExpect(jsonPath("$.levels.MEMBER").isNumber())
                .andExpect(jsonPath("$.levels.CONTRIBUTOR").isNumber())
                .andExpect(jsonPath("$.levels.REFERENT").isNumber());
    }

    @Test
    void lesChiffresSuiventLaBase() throws Exception {
        JsonNode before = stats();

        Member amina = register("Amina", "NE");
        Member chidi = withReputation(register("Chidi", "NG"), 1600);
        long questionId = askQuestion(amina, "Webhook M-Pesa reçu sans en-tête de signature",
                "Le callback STK Push arrive sans signature, comment vérifier qu'il vient bien de Safaricom ?", "KE");
        long answerId = read(mvc.perform(post("/api/v1/questions/{id}/answers", questionId).with(csrf())
                        .session(chidi.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("body", "Safaricom ne signe pas ce callback : limitez l'adresse "
                                + "d'appel à leurs adresses IP et confirmez la transaction par l'API de requête."))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(put("/api/v1/questions/{id}/accepted-answer", questionId).with(csrf())
                        .session(amina.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("answerId", answerId))))
                .andExpect(status().isOk());

        JsonNode after = stats();
        assertThat(after.get("questions").asLong()).isEqualTo(before.get("questions").asLong() + 1);
        assertThat(after.get("answers").asLong()).isEqualTo(before.get("answers").asLong() + 1);
        assertThat(after.get("members").asLong()).isEqualTo(before.get("members").asLong() + 2);
        assertThat(after.get("levels").get("REFERENT").asLong())
                .isGreaterThanOrEqualTo(before.get("levels").get("REFERENT").asLong() + 1);
        assertThat(after.get("solvedRate").asDouble()).isBetween(0.01, 1.0);
        assertThat(after.get("countries").asLong()).isGreaterThanOrEqualTo(2);
    }
}
