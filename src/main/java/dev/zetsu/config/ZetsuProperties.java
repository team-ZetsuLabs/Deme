package dev.zetsu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param frontUrl     adresse du site web, où l'on renvoie le membre après une connexion OAuth
 * @param cookieSecure cookies réservés au HTTPS ; à désactiver seulement en local sans HTTPS
 * @param uploadsDir   dossier des téléversements (CV), hors de tout dossier public
 */
@ConfigurationProperties("zetsu")
public record ZetsuProperties(String frontUrl, boolean cookieSecure, String uploadsDir) {

    public ZetsuProperties {
        if (frontUrl == null || frontUrl.isBlank()) {
            frontUrl = "/";
        }
        if (uploadsDir == null || uploadsDir.isBlank()) {
            uploadsDir = "data/uploads";
        }
    }
}
