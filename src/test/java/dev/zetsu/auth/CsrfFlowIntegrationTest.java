package dev.zetsu.auth;

import dev.zetsu.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Parcours CSRF réel, tel que le fait {@code api.ts}. Contexte neuf : {@code csrf()} de spring-security-test,
 * utilisé par les autres tests, remplace le dépôt de jetons dans le contexte partagé.
 */
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class CsrfFlowIntegrationTest extends IntegrationTest {

    @Test
    void leJetonDuCookieXsrfPermetDeModifier() throws Exception {
        MvcResult csrfResult = mvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andReturn();
        Cookie cookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        assertThat(cookie.isHttpOnly()).isFalse();
        assertThat(read(csrfResult).get("token").asText()).isEqualTo(cookie.getValue());

        mvc.perform(post("/api/v1/auth/login").cookie(cookie).header("X-XSRF-TOKEN", cookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", "inconnu@exemple.ci", "password", "nimporte-quoi"))))
                // Le CSRF est passé : on arrive bien jusqu'au contrôle du mot de passe.
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }
}
