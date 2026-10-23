package dev.zetsu.auth;

import dev.zetsu.user.Role;
import dev.zetsu.user.User;
import dev.zetsu.user.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.Serial;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Le membre connecté, gardé dans la session. Même objet que la connexion se fasse par email ou par OAuth.
 * On n'y garde que l'identifiant et le rôle : le reste est relu en base quand on en a besoin.
 */
public final class ZetsuPrincipal implements UserDetails, OAuth2User {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long id;
    private final String username;
    private final String passwordHash;
    private final Role role;
    private final boolean enabled;

    private ZetsuPrincipal(Long id, String username, String passwordHash, Role role, boolean enabled) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
    }

    public static ZetsuPrincipal of(User user) {
        return new ZetsuPrincipal(user.getId(), user.getUsername(), user.getPasswordHash(), user.getRole(),
                user.getStatus() == UserStatus.ACTIVE);
    }

    public Long id() {
        return id;
    }

    public Role role() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    /**
     * Faux pour un compte suspendu. Volontairement pas exposé par {@code isEnabled()} : Spring Security le
     * vérifierait avant le mot de passe et révélerait la suspension à n'importe qui.
     */
    public boolean active() {
        return enabled;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return Map.of("id", id, "username", username);
    }

    @Override
    public String getName() {
        return String.valueOf(id);
    }

    /** Le hash n'a plus rien à faire en session une fois la connexion vérifiée. */
    public ZetsuPrincipal withoutPassword() {
        return new ZetsuPrincipal(id, username, null, role, enabled);
    }
}
