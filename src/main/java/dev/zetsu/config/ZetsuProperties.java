package dev.zetsu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param frontUrl     adresse du site web, où l'on renvoie le membre après une connexion OAuth
 * @param cookieSecure cookies réservés au HTTPS ; à désactiver seulement en local sans HTTPS
 */
@ConfigurationProperties("zetsu")
public record ZetsuProperties(String frontUrl, boolean cookieSecure) {

    public ZetsuProperties {
        if (frontUrl == null || frontUrl.isBlank()) {
            frontUrl = "/";
        }
    }
}
