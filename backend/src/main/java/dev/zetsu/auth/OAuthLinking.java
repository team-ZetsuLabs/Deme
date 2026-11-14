package dev.zetsu.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.Serial;
import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * SET-4 : lier un compte GitHub ou Google au membre déjà connecté. {@code POST /users/me/connections/{provider}}
 * (protégé par CSRF) note l'intention dans la session ; au retour du fournisseur, {@link OAuthUserService} la
 * consomme et rattache le compte externe au lieu d'ouvrir une autre session. L'intention expire vite : un retour
 * OAuth tardif redevient une connexion ordinaire.
 */
public final class OAuthLinking {

    /** Posé sur la requête de retour quand une liaison était demandée, pour choisir la redirection. */
    public static final String LINKING_ATTRIBUTE = "zetsu.oauth.linking";

    private static final String SESSION_KEY = "zetsu.oauth.linkIntent";
    private static final Duration VALIDITY = Duration.ofMinutes(10);

    record Intent(Long userId, String provider, Instant expiresAt) implements Serializable {
        @Serial
        private static final long serialVersionUID = 1L;
    }

    private OAuthLinking() {
    }

    static void start(HttpSession session, Long userId, String provider) {
        session.setAttribute(SESSION_KEY, new Intent(userId, provider, Instant.now().plus(VALIDITY)));
    }

    /** L'intention de la requête en cours pour ce fournisseur, retirée de la session dès qu'elle est lue. */
    static Optional<Intent> consume(String provider) {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return Optional.empty();
        }
        HttpServletRequest request = attributes.getRequest();
        HttpSession session = request.getSession(false);
        if (session == null || !(session.getAttribute(SESSION_KEY) instanceof Intent intent)
                || !intent.provider().equals(provider)) {
            return Optional.empty();
        }
        session.removeAttribute(SESSION_KEY);
        if (Instant.now().isAfter(intent.expiresAt())) {
            return Optional.empty();
        }
        request.setAttribute(LINKING_ATTRIBUTE, provider);
        return Optional.of(intent);
    }
}
