package dev.zetsu.auth;

import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UserRepository.AccountState;
import dev.zetsu.user.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * La session garde le membre tel qu'il était à la connexion : un compte suspendu ou supprimé depuis un autre
 * appareil resterait connecté, et un rôle changé dans le back office ne compterait qu'à la connexion suivante.
 * On relit donc le statut et le rôle à chaque requête authentifiée (une lecture par clé primaire) : la session
 * est fermée si le compte n'est plus actif (la requête continue en visiteur), et rafraîchie si le rôle a changé.
 */
public class ActiveAccountFilter extends OncePerRequestFilter {

    private final UserRepository users;
    private final SecurityContextRepository contextRepository;

    public ActiveAccountFilter(UserRepository users, SecurityContextRepository contextRepository) {
        this.users = users;
        this.contextRepository = contextRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ZetsuPrincipal me) {
            Optional<AccountState> state = users.findAccountState(me.id());
            if (state.map(AccountState::getStatus).orElse(UserStatus.DELETED) != UserStatus.ACTIVE) {
                new SecurityContextLogoutHandler().logout(request, response, auth);
            } else if (state.get().getRole() != me.role()) {
                refresh(me.id(), request, response);
            }
        }
        chain.doFilter(request, response);
    }

    private void refresh(Long userId, HttpServletRequest request, HttpServletResponse response) {
        users.findById(userId).ifPresent(user -> {
            ZetsuPrincipal fresh = ZetsuPrincipal.of(user);
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                    fresh, null, fresh.getAuthorities()));
            SecurityContextHolder.setContext(context);
            contextRepository.saveContext(context, request, response);
        });
    }
}
