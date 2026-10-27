package dev.zetsu.ai;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiProviderTest {

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final GeminiProvider gemini = new GeminiProvider(builder,
            new AiProperties("gemini", "cle-factice", "gemini-2.5-flash-lite", Duration.ofSeconds(7), Duration.ofHours(24)));

    @Test
    void consignesEtTexteDuMembreSepares() {
        server.expect(requestTo(GeminiProvider.BASE_URL + "/models/gemini-2.5-flash-lite:generateContent"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "cle-factice"))
                .andExpect(jsonPath("$.systemInstruction.parts[0].text").value("consignes"))
                .andExpect(jsonPath("$.contents[0].role").value("user"))
                .andExpect(jsonPath("$.contents[0].parts[0].text").value("{\"title\":\"ça marche pas\"}"))
                .andExpect(jsonPath("$.generationConfig.responseMimeType").value("application/json"))
                .andRespond(withSuccess("""
                        {"candidates": [{"content": {"parts": [{"text": "{\\"missing\\": [\\"CODE\\"]}"}]}}]}""",
                        MediaType.APPLICATION_JSON));

        assertThat(gemini.generateJson("consignes", "{\"title\":\"ça marche pas\"}")).isEqualTo("{\"missing\": [\"CODE\"]}");
        server.verify();
    }

    @Test
    void erreurDuFournisseur() {
        server.expect(requestTo(GeminiProvider.BASE_URL + "/models/gemini-2.5-flash-lite:generateContent"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        assertThatThrownBy(() -> gemini.generateJson("consignes", "{}")).isInstanceOf(AiProvider.Unavailable.class);
    }

    @Test
    void reponseSansTexte() {
        server.expect(requestTo(GeminiProvider.BASE_URL + "/models/gemini-2.5-flash-lite:generateContent"))
                .andRespond(withSuccess("{\"candidates\": [{\"finishReason\": \"SAFETY\"}]}", MediaType.APPLICATION_JSON));
        assertThatThrownBy(() -> gemini.generateJson("consignes", "{}")).isInstanceOf(AiProvider.Unavailable.class);
    }
}
