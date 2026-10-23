package dev.zetsu.moderation;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Réglages de la modération (section 7).
 *
 * @param autoHideThreshold signalements de comptes distincts qui masquent un contenu automatiquement (MOD-2)
 */
@ConfigurationProperties(prefix = "zetsu.moderation")
public record ModerationProperties(int autoHideThreshold) {
}
