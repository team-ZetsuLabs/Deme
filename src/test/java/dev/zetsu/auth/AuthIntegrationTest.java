package dev.zetsu.auth;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

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
        Member awa = register("Awa");

        mvc.perform(get("/api/v1/auth/me").session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(awa.username()))
                .andExpect(jsonPath("$.role").value("MEMBER"))
                .andExpect(jsonPath("$.reputation").value(0));
    }

    @Test
    void emailDejaPrisRenvoie409() throws Exception {
        Member awa = register("Awa");

        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", awa.email().toUpperCase(), "password", "mot-de-passe-solide",
                                "username", "autre_pseudo", "displayName", "Autre"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("EMAIL_TAKEN"));
    }

    @Test
    void validationRenvoieLesChampsEnErreur() throws Exception {
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", "pas-un-email", "password", "court",
                                "username", "a", "displayName", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.email").value("Email invalide"))
                .andExpect(jsonPath("$.fields.password").exists())
                .andExpect(jsonPath("$.fields.username").exists())
                .andExpect(jsonPath("$.fields.displayName").value("Obligatoire"));
    }

    @Test
    void connexionParEmail() throws Exception {
        Member kofi = register("Kofi");

        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", kofi.email(), "password", "mauvais-mot-de-passe"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        MvcResult ok = mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", kofi.email(), "password", "mot-de-passe-solide"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(kofi.username()))
                .andReturn();

        mvc.perform(get("/api/v1/auth/me").session((org.springframework.mock.web.MockHttpSession) ok.getRequest().getSession(false)))
                .andExpect(status().isOk());
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
}
