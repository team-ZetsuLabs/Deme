package dev.zetsu.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.stereotype.Component;

/**
 * Ouvre la session d'un membre après une connexion ou une inscription par email : nouvel identifiant de
 * session (contre la fixation de session) et nouveau jeton CSRF.
 */
@Component
public class SessionLogin {

    private final SecurityContextRepository contextRepository;
    private final CsrfTokenRepository csrfRepository;

    public SessionLogin(SecurityContextRepository contextRepository, CsrfTokenRepository csrfRepository) {
        this.contextRepository = contextRepository;
        this.csrfRepository = csrfRepository;
    }

    public void open(ZetsuPrincipal principal, HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId();
        } else {
            request.getSession(true);
        }

        var authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal.withoutPassword(), null, principal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);

        CsrfToken fresh = csrfRepository.generateToken(request);
        csrfRepository.saveToken(fresh, request, response);
        request.setAttribute(CsrfToken.class.getName(), fresh);
        request.setAttribute(fresh.getParameterName(), fresh);
    }
}
