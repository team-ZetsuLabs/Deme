package dev.zetsu.auth;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.RequestBuilder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends IntegrationTest {

    @Test
    void inscriptionOuvreUneSession() throws Exception {
        Member awa = register("Awa", "CI");

        mvc.perform(get("/api/v1/auth/me").session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(awa.username()))
                .andExpect(jsonPath("$.countryCode").value("CI"))
                .andExpect(jsonPath("$.role").value("MEMBER"))
                .andExpect(jsonPath("$.level").value("NEWCOMER"))
                .andExpect(jsonPath("$.language").value("fr"))
                .andExpect(jsonPath("$.visibleToRecruiters").value(false))
                .andExpect(jsonPath("$.reputation").value(0));
    }

    @Test
    void lePseudoEstDeduitDuNom() throws Exception {
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("displayName", "Aïcha Traoré", "email", "aicha.pseudo@exemple.ml",
                                "countryCode", "ML", "password", PASSWORD))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("aicha_traore"))
                .andExpect(jsonPath("$.displayName").value("Aïcha Traoré"));
    }

    @Test
    void emailDejaPrisRenvoie409() throws Exception {
        Member awa = register("Awa");

        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("displayName", "Autre", "email", awa.email().toUpperCase(),
                                "countryCode", "SN", "password", PASSWORD))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    void validationRenvoieLesChampsEnErreur() throws Exception {
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("displayName", "", "email", "pas-un-email",
                                "countryCode", "XX", "password", "sanschiffre"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.displayName").value("Obligatoire"))
                .andExpect(jsonPath("$.fields.email").value("Email invalide"))
                .andExpect(jsonPath("$.fields.countryCode").value("Code pays inconnu"))
                .andExpect(jsonPath("$.fields.password").value("8 caractères minimum, dont un chiffre"));
    }

    @Test
    void connexionParEmail() throws Exception {
        Member kofi = register("Kofi");

        mvc.perform(login(kofi.email(), "mauvais-mot-de-passe1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        MvcResult ok = mvc.perform(login(kofi.email(), PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(kofi.username()))
                .andReturn();

        mvc.perform(get("/api/v1/auth/me").session((MockHttpSession) ok.getRequest().getSession(false)))
                .andExpect(status().isOk());
    }

    @Test
    void cinqEssaisRatesBloquentLeCompte() throws Exception {
        Member kofi = register("Kofi");
        for (int i = 0; i < 5; i++) {
            mvc.perform(login(kofi.email(), "mauvais" + i)).andExpect(status().isUnauthorized());
        }

        // Même le bon mot de passe est refusé pendant 15 minutes.
        mvc.perform(login(kofi.email(), PASSWORD))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("LOGIN_LOCKED"));
    }

    @Test
    void compteSuspenduNePeutPasSeConnecter() throws Exception {
        Member kofi = register("Kofi");
        jdbc.update("update users set status = 'SUSPENDED' where id = ?", kofi.id());

        mvc.perform(login(kofi.email(), "mauvais1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        mvc.perform(login(kofi.email(), PASSWORD))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_SUSPENDED"));
    }

    @Test
    void nonConnecteRenvoie401AuFormatApiError() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void sansJetonCsrfRenvoie403() throws Exception {
        Member awa = register("Awa");

        mvc.perform(post("/api/v1/questions").session(awa.session()).contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CSRF_INVALID"));
    }

    @Test
    void deconnexionFermeLaSession() throws Exception {
        Member awa = register("Awa");

        mvc.perform(post("/api/v1/auth/logout").with(csrf()).session(awa.session()))
                .andExpect(status().isNoContent());
        assertThat(awa.session().isInvalid()).isTrue();
    }

    @Test
    void aucunFournisseurOAuthSansProfilOauth() throws Exception {
        mvc.perform(get("/api/v1/auth/providers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providers").isEmpty());
    }

    private RequestBuilder login(String email, String password) throws Exception {
        return post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("email", email, "password", password)));
    }
}
