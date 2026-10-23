package dev.zetsu.user;

public enum UserStatus {
    ACTIVE,
    SUSPENDED,
    /** AUTH-6 : anonymisé, ne peut plus se connecter. */
    DELETED
}
