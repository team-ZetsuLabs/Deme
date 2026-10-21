package dev.zetsu.auth;

import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UsernameGenerator;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Connexion GitHub ou Google : retrouve le membre lié au compte externe, ou le crée à la première connexion.
 * On ne rattache jamais automatiquement un compte externe à un compte email existant : l'email d'inscription
 * n'est pas vérifié, ce serait une porte ouverte au vol de compte.
 */
@Service
public class OAuthUserService extends DefaultOAuth2UserService {

    private final OAuthAccountRepository accounts;
    private final UserRepository users;
    private final UsernameGenerator usernames;

    public OAuthUserService(OAuthAccountRepository accounts, UserRepository users, UsernameGenerator usernames) {
        this.accounts = accounts;
        this.users = users;
        this.usernames = usernames;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User external = super.loadUser(request);
        String provider = request.getClientRegistration().getRegistrationId();
        ExternalProfile profile = ExternalProfile.from(provider, external.getAttributes());

        User user = accounts.findWithUser(provider, profile.id())
                .map(OAuthAccount::getUser)
                .orElseGet(() -> createUser(provider, profile));
        return ZetsuPrincipal.of(user).withoutPassword();
    }

    private User createUser(String provider, ExternalProfile profile) {
        User user = new User(usernames.available(profile.login()), profile.displayName());
        user.setAvatarUrl(profile.avatarUrl());
        if (profile.email() != null && !users.existsByEmailIgnoreCase(profile.email())) {
            user.setEmail(profile.email().toLowerCase());
        }
        users.save(user);
        accounts.save(new OAuthAccount(user, provider, profile.id()));
        return user;
    }

    record ExternalProfile(String id, String login, String displayName, String email, String avatarUrl) {

        static ExternalProfile from(String provider, Map<String, Object> a) {
            return switch (provider) {
                case "github" -> new ExternalProfile(
                        String.valueOf(a.get("id")),
                        str(a, "login"),
                        firstNonBlank(str(a, "name"), str(a, "login")),
                        str(a, "email"),
                        httpsOrNull(str(a, "avatar_url")));
                case "google" -> new ExternalProfile(
                        str(a, "sub"),
                        firstNonBlank(str(a, "given_name"), localPart(str(a, "email"))),
                        firstNonBlank(str(a, "name"), str(a, "given_name")),
                        Boolean.TRUE.equals(a.get("email_verified")) ? str(a, "email") : null,
                        httpsOrNull(str(a, "picture")));
                default -> throw new OAuth2AuthenticationException(
                        new OAuth2Error("unsupported_provider", "Fournisseur non pris en charge", null));
            };
        }

        private static String str(Map<String, Object> a, String key) {
            Object v = a.get(key);
            return v == null ? null : v.toString();
        }

        private static String firstNonBlank(String a, String b) {
            if (a != null && !a.isBlank()) {
                return a.length() > 80 ? a.substring(0, 80) : a;
            }
            return b == null || b.isBlank() ? "Membre" : b;
        }

        private static String localPart(String email) {
            return email == null ? null : email.substring(0, Math.max(0, email.indexOf('@')));
        }

        private static String httpsOrNull(String url) {
            return url != null && url.startsWith("https://") && url.length() <= 500 ? url : null;
        }
    }
}
