package dev.zetsu.auth;

import dev.zetsu.IntegrationTest;
import dev.zetsu.auth.OAuthUserService.ExternalProfile;
import dev.zetsu.user.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SET-4. GitHub et Google sont déclarés avec de faux identifiants ; le retour du fournisseur est simulé en appelant
 * {@link OAuthUserService#resolve} dans la session du membre, sans réseau.
 */
@Import(ConnectionIntegrationTest.FakeProviders.class)
class ConnectionIntegrationTest extends IntegrationTest {

    @TestConfiguration
    static class FakeProviders {
        @Bean
        ClientRegistrationRepository clientRegistrationRepository() {
            return new InMemoryClientRegistrationRepository(
                    CommonOAuth2Provider.GITHUB.getBuilder("github").clientId("test").clientSecret("test").build(),
                    CommonOAuth2Provider.GOOGLE.getBuilder("google").clientId("test").clientSecret("test")
                            .scope("profile", "email").build());
        }
    }

    @Autowired
    private OAuthUserService oauth;

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    /** Retour du fournisseur dans la session donnée ; renvoie le membre connecté au final. */
    private Long callback(MockHttpSession session, String provider, String externalId) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        try {
            return oauth.resolve(provider, new ExternalProfile(externalId, "awa-dev", "Awa Koné", null,
                    "https://avatars.githubusercontent.com/u/4242")).id();
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    @Test
    void lierPuisDelierUnCompte() throws Exception {
        Member awa = register("Awa", "CI");
        mvc.perform(get("/api/v1/users/me/connections").session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasPassword").value(true))
                .andExpect(jsonPath("$.accounts[0].provider").value("github"))
                .andExpect(jsonPath("$.accounts[0].linked").value(false))
                .andExpect(jsonPath("$.accounts[1].provider").value("google"));

        mvc.perform(post("/api/v1/users/me/connections/twitter").with(csrf()).session(awa.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROVIDER_NOT_FOUND"));
        mvc.perform(post("/api/v1/users/me/connections/github").with(csrf()).session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorizationUrl").value("/api/v1/auth/oauth2/authorization/github"));

        // Au retour, le compte GitHub est rattaché à Awa : même membre, pas de nouveau compte.
        assertThat(callback(awa.session(), "github", "gh-awa-1")).isEqualTo(awa.id());
        mvc.perform(get("/api/v1/users/me/connections").session(awa.session()))
                .andExpect(jsonPath("$.accounts[0].linked").value(true))
                .andExpect(jsonPath("$.accounts[0].linkedAt").exists())
                .andExpect(jsonPath("$.accounts[0].canUnlink").value(true));
        mvc.perform(get("/api/v1/auth/me").session(awa.session()))
                .andExpect(jsonPath("$.avatarUrl").value("https://avatars.githubusercontent.com/u/4242"));
        // L'intention est consommée : un second retour est une connexion ordinaire, qui retrouve Awa par son compte.
        assertThat(callback(new MockHttpSession(), "github", "gh-awa-1")).isEqualTo(awa.id());

        mvc.perform(post("/api/v1/users/me/connections/github").with(csrf()).session(awa.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_LINKED"));

        mvc.perform(delete("/api/v1/users/me/connections/github").with(csrf()).session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accounts[0].linked").value(false));
        mvc.perform(delete("/api/v1/users/me/connections/github").with(csrf()).session(awa.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_LINKED"));
    }

    @Test
    void unCompteDejaLieAUnAutreMembreEstRefuse() throws Exception {
        Member kofi = register("Kofi", "GH");
        mvc.perform(post("/api/v1/users/me/connections/google").with(csrf()).session(kofi.session()));
        callback(kofi.session(), "google", "g-kofi-1");

        Member moussa = register("Moussa", "ML");
        mvc.perform(post("/api/v1/users/me/connections/google").with(csrf()).session(moussa.session()))
                .andExpect(status().isOk());
        assertThatThrownBy(() -> callback(moussa.session(), "google", "g-kofi-1"))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .extracting(e -> ((OAuth2AuthenticationException) e).getError().getErrorCode())
                .isEqualTo("ALREADY_LINKED_ELSEWHERE");
        mvc.perform(get("/api/v1/users/me/connections").session(moussa.session()))
                .andExpect(jsonPath("$.accounts[1].linked").value(false));
    }

    @Test
    void sansIntentionLeRetourEstUneConnexionOrdinaire() throws Exception {
        Member chidi = register("Chidi", "NG");
        // Intention pour Google, retour de GitHub : pas de liaison, on ouvre un autre compte.
        mvc.perform(post("/api/v1/users/me/connections/google").with(csrf()).session(chidi.session()));
        assertThat(callback(chidi.session(), "github", "gh-chidi-1")).isNotEqualTo(chidi.id());
    }

    @Test
    void onNeDeliePasSonDernierMoyenDeConnexion() throws Exception {
        User viaGithub = oauth.findOrCreate("github",
                new ExternalProfile("gh-ngozi-7", "ngozi-dev", "Ngozi Okafor", null, null));
        ZetsuPrincipal principal = ZetsuPrincipal.of(viaGithub);
        var auth = authentication(UsernamePasswordAuthenticationToken.authenticated(principal, null,
                principal.getAuthorities()));

        mvc.perform(get("/api/v1/users/me/connections").with(auth))
                .andExpect(jsonPath("$.hasPassword").value(false))
                .andExpect(jsonPath("$.accounts[0].linked").value(true))
                .andExpect(jsonPath("$.accounts[0].canUnlink").value(false));
        mvc.perform(delete("/api/v1/users/me/connections/github").with(csrf()).with(auth))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LAST_LOGIN_METHOD"));
    }
}
