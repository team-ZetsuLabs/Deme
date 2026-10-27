package dev.zetsu.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Réglages de l'assistant IA (section 6.2).
 *
 * @param provider fournisseur : {@code gemini}, ou {@code none} pour couper l'assistant
 * @param apiKey   clé d'API, uniquement depuis l'environnement ; vide, l'assistant est coupé
 * @param model    modèle du fournisseur
 * @param timeout  délai maximal d'une réponse, sous les 8 secondes au bout desquelles le front abandonne
 * @param cacheTtl durée de vie d'une suggestion en cache
 */
@ConfigurationProperties("zetsu.ai")
public record AiProperties(String provider, String apiKey, String model, Duration timeout, Duration cacheTtl) {

    public AiProperties {
        if (provider == null || provider.isBlank()) {
            provider = "gemini";
        }
        if (model == null || model.isBlank()) {
            model = "gemini-2.5-flash-lite";
        }
        if (timeout == null) {
            timeout = Duration.ofSeconds(7);
        }
        if (cacheTtl == null) {
            cacheTtl = Duration.ofHours(24);
        }
    }

    public boolean configured() {
        return !"none".equals(provider) && apiKey != null && !apiKey.isBlank();
    }
}
