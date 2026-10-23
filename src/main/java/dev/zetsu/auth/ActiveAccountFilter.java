package dev.zetsu.auth;

import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * La session ne garde que l'identifiant du membre : un compte suspendu ou supprimé depuis un autre appareil
 * resterait connecté. On relit donc le statut à chaque requête authentifiée (une lecture par clé primaire) et
 * on ferme la session s'il n'est plus actif ; la requête continue alors en visiteur.
 */
public class ActiveAccountFilter extends OncePerRequestFilter {

    private final UserRepository users;

    public ActiveAccountFilter(UserRepository users) {
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ZetsuPrincipal me
                && users.findStatus(me.id()).orElse(UserStatus.DELETED) != UserStatus.ACTIVE) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        chain.doFilter(request, response);
    }
}
