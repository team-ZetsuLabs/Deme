package dev.zetsu.ai;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;

/**
 * Google Gemini, choisi pour son palier gratuit. La clé passe dans l'en-tête {@code x-goog-api-key}, jamais dans
 * l'URL (qui finit dans les journaux). Les consignes vont dans {@code systemInstruction}, le texte du membre dans
 * le message de l'utilisateur.
 */
class GeminiProvider implements AiProvider {

    static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

    private final RestClient http;
    private final String model;

    GeminiProvider(RestClient.Builder builder, AiProperties props) {
        this.http = builder.baseUrl(BASE_URL).defaultHeader("x-goog-api-key", props.apiKey()).build();
        this.model = props.model();
    }

    @Override
    public String generateJson(String instructions, String memberData) {
        Map<String, Object> request = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", instructions))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", memberData)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2,
                        "maxOutputTokens", 512,
                        "thinkingConfig", Map.of("thinkingBudget", 0)));
        JsonNode response;
        try {
            response = http.post()
                    .uri("/models/{model}:generateContent", model)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new Unavailable("Gemini injoignable ou en erreur", e);
        }
        String text = response == null ? null : response.at("/candidates/0/content/parts/0/text").asText(null);
        if (text == null || text.isBlank()) {
            throw new Unavailable("Gemini n'a renvoyé aucun texte");
        }
        return text;
    }
}
