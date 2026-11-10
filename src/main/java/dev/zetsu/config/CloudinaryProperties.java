package dev.zetsu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Stockage des photos de profil et des CV chez Cloudinary. Sans les trois identifiants, tout reste sur le disque
 * du serveur ({@code zetsu.uploads-dir}) : en local et dans les tests, rien à configurer.
 *
 * @param cloudName nom du compte Cloudinary
 * @param apiKey    clé d'API, uniquement depuis l'environnement
 * @param apiSecret secret d'API, uniquement depuis l'environnement ; ne quitte jamais le serveur
 * @param folder    dossier racine des fichiers chez Cloudinary, pour séparer démo et essais
 * @param apiBase   adresse de l'API (remplacée seulement par les tests)
 * @param timeout   délai maximal d'un appel à Cloudinary
 */
@ConfigurationProperties("zetsu.cloudinary")
public record CloudinaryProperties(String cloudName, String apiKey, String apiSecret, String folder, String apiBase,
                                   Duration timeout) {

    public CloudinaryProperties {
        if (folder == null || folder.isBlank()) {
            folder = "zetsu";
        }
        // La référence d'un CV (cld:<dossier>/cv/<uuid>.pdf) doit tenir dans les 60 caractères de cv_file.
        if (!folder.matches("[a-z0-9_-]{1,12}")) {
            throw new IllegalArgumentException(
                    "zetsu.cloudinary.folder : 1 à 12 caractères parmi a-z, 0-9, _ et -");
        }
        if (apiBase == null || apiBase.isBlank()) {
            apiBase = "https://api.cloudinary.com";
        }
        if (timeout == null) {
            timeout = Duration.ofSeconds(20);
        }
    }

    public boolean configured() {
        return notBlank(cloudName) && notBlank(apiKey) && notBlank(apiSecret);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
