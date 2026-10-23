package dev.zetsu.user;

/**
 * Publié pendant la suppression d'un compte (AUTH-6), dans la même transaction : chaque domaine efface ce qui
 * appartient au membre (candidatures, offres…) sans que {@code user} dépende d'eux.
 */
public record AccountDeleted(Long userId) {
}
