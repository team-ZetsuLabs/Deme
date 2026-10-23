package dev.zetsu.auth;

import dev.zetsu.auth.AuthDtos.ConnectedAccount;
import dev.zetsu.auth.AuthDtos.Connections;
import dev.zetsu.auth.AuthDtos.LinkStart;
import dev.zetsu.common.ApiException;
import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Comptes connectés (SET-4) : lier ou délier GitHub et Google, sans jamais perdre son dernier moyen de connexion. */
@Service
public class ConnectionService {

    private final OAuthAccountRepository accounts;
    private final UserRepository users;
    private final ObjectProvider<ClientRegistrationRepository> registrations;

    public ConnectionService(OAuthAccountRepository accounts, UserRepository users,
                             ObjectProvider<ClientRegistrationRepository> registrations) {
        this.accounts = accounts;
        this.users = users;
        this.registrations = registrations;
    }

    @Transactional(readOnly = true)
    public Connections list(Long userId) {
        User user = users.findById(userId).orElseThrow();
        Map<String, OAuthAccount> linked = accounts.findAllOf(userId).stream()
                .collect(Collectors.toMap(OAuthAccount::getProvider, Function.identity(), (a, b) -> a));
        boolean hasPassword = user.getPasswordHash() != null;
        List<ConnectedAccount> out = new ArrayList<>();
        for (String provider : enabledProviders()) {
            OAuthAccount account = linked.get(provider);
            boolean otherMethod = hasPassword || linked.keySet().stream().anyMatch(p -> !p.equals(provider));
            out.add(new ConnectedAccount(provider, account != null, account == null ? null : account.getCreatedAt(),
                    account != null && otherMethod));
        }
        return new Connections(out, hasPassword);
    }

    /** Note l'intention dans la session ; le front navigue ensuite vers l'adresse renvoyée. */
    @Transactional(readOnly = true)
    public LinkStart startLink(String provider, Long userId, HttpSession session) {
        requireEnabled(provider);
        if (accounts.findAllOf(userId).stream().anyMatch(a -> a.getProvider().equals(provider))) {
            throw ApiException.conflict("ALREADY_LINKED", "Ce compte est déjà lié");
        }
        OAuthLinking.start(session, userId, provider);
        return new LinkStart(AuthController.OAUTH_AUTHORIZATION_BASE + "/" + provider);
    }

    @Transactional
    public Connections unlink(String provider, Long userId) {
        requireEnabled(provider);
        Connections current = list(userId);
        ConnectedAccount account = current.accounts().stream().filter(a -> a.provider().equals(provider))
                .findFirst().orElseThrow();
        if (!account.linked()) {
            throw ApiException.notFound("NOT_LINKED", "Ce compte n'est pas lié");
        }
        if (!account.canUnlink()) {
            throw ApiException.conflict("LAST_LOGIN_METHOD", "Impossible de délier votre dernier moyen de connexion");
        }
        accounts.unlink(userId, provider);
        return list(userId);
    }

    private void requireEnabled(String provider) {
        if (!enabledProviders().contains(provider)) {
            throw ApiException.notFound("PROVIDER_NOT_FOUND", "Fournisseur inconnu ou désactivé");
        }
    }

    private List<String> enabledProviders() {
        List<String> ids = new ArrayList<>();
        if (registrations.getIfAvailable() instanceof Iterable<?> iterable) {
            for (Object o : iterable) {
                ids.add(((ClientRegistration) o).getRegistrationId());
            }
        }
        ids.sort(String::compareTo);
        return ids;
    }
}
