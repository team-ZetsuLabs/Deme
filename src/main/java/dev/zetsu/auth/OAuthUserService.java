package dev.zetsu.auth;

import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UserStatus;
import dev.zetsu.user.UsernameGenerator;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Connexion GitHub ou Google (AUTH-2) : retrouve le membre lié au compte externe, ou le rattache par email,
 * ou le crée à la première connexion.
 * <p>
 * Rattachement par email seulement si le fournisseur garantit l'email ET que le compte Zetsu existant a lui
 * aussi un email vérifié (donc venu de GitHub ou Google). Un compte créé par email et mot de passe n'est jamais
 * rattaché tant que la vérification d'email (AUTH-4) n'existe pas : sinon, s'inscrire avec l'email de
 * quelqu'un d'autre suffirait à prendre son compte.
 */
@Service
public class OAuthUserService extends DefaultOAuth2UserService {

    private static final String GITHUB_EMAILS = "https://api.github.com/user/emails";

    private final OAuthAccountRepository accounts;
    private final UserRepository users;
    private final UsernameGenerator usernames;
    private final RestClient http = RestClient.create();

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
        if ("github".equals(provider)) {
            profile = profile.withVerifiedEmail(githubVerifiedEmail(request.getAccessToken().getTokenValue()));
        }
        User user = findOrCreate(provider, profile);
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new OAuth2AuthenticationException(new OAuth2Error("account_suspended", "Ce compte est suspendu", null));
        }
        return ZetsuPrincipal.of(user).withoutPassword();
    }

    @Transactional
    public User findOrCreate(String provider, ExternalProfile profile) {
        Optional<OAuthAccount> linked = accounts.findWithUser(provider, profile.id());
        if (linked.isPresent()) {
            return linked.get().getUser();
        }
        String email = profile.verifiedEmail();
        if (email != null) {
            Optional<User> sameEmail = users.findByEmailIgnoreCase(email);
            if (sameEmail.isPresent() && sameEmail.get().isEmailVerified()) {
                accounts.save(new OAuthAccount(sameEmail.get(), provider, profile.id()));
                return sameEmail.get();
            }
            if (sameEmail.isPresent()) {
                email = null;
            }
        }
        User user = new User(usernames.available(profile.login()), profile.displayName());
        user.setAvatarUrl(profile.avatarUrl());
        if (email != null) {
            user.setEmail(email.toLowerCase());
            user.setEmailVerified(true);
        }
        users.save(user);
        accounts.save(new OAuthAccount(user, provider, profile.id()));
        return user;
    }

    /** L'email de /user est l'email public, pas forcément vérifié : on lit l'email principal vérifié. */
    private String githubVerifiedEmail(String token) {
        try {
            List<Map<String, Object>> emails = http.get().uri(GITHUB_EMAILS)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
            if (emails == null) {
                return null;
            }
            return emails.stream()
                    .filter(e -> Boolean.TRUE.equals(e.get("primary")) && Boolean.TRUE.equals(e.get("verified")))
                    .map(e -> String.valueOf(e.get("email")))
                    .findFirst()
                    .orElse(null);
        } catch (RestClientException e) {
            return null;
        }
    }

    public record ExternalProfile(String id, String login, String displayName, String verifiedEmail,
                                  String avatarUrl) {

        ExternalProfile withVerifiedEmail(String email) {
            return new ExternalProfile(id, login, displayName, email, avatarUrl);
        }

        static ExternalProfile from(String provider, Map<String, Object> a) {
            return switch (provider) {
                case "github" -> new ExternalProfile(
                        String.valueOf(a.get("id")),
                        str(a, "login"),
                        firstNonBlank(str(a, "name"), str(a, "login")),
                        null,
                        httpsOrNull(str(a, "avatar_url")));
                case "google" -> new ExternalProfile(
                        str(a, "sub"),
                        firstNonBlank(str(a, "name"), localPart(str(a, "email"))),
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
