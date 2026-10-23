package dev.zetsu.user;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.RequestBuilder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AccountDeletionIntegrationTest extends IntegrationTest {

    private static final String TITLE = "Pourquoi mon paiement Wave reste en attente après le callback ?";
    private static final String BODY = "Le callback Wave arrive bien mais le statut reste PENDING côté API, même après une minute.";

    @Test
    void ilFautRecopierSonPseudo() throws Exception {
        Member awa = register("Awa");

        mvc.perform(deleteAccount(awa.session(), "pas_mon_pseudo"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CONFIRMATION_MISMATCH"));
        mvc.perform(deleteAccount(awa.session(), ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.confirmation").value("Obligatoire"));

        mvc.perform(get("/api/v1/auth/me").session(awa.session())).andExpect(status().isOk());
    }

    @Test
    void lesContenusRestentSousUtilisateurSupprime() throws Exception {
        Member awa = register("Awa", "SN");
        Member kofi = withReputation(register("Kofi", "GH"), 50);
        long questionId = askQuestion(awa, TITLE, BODY, "SN");
        mvc.perform(post("/api/v1/questions/" + questionId + "/votes").with(csrf()).session(kofi.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("value", 1))))
                .andExpect(status().isOk());

        mvc.perform(deleteAccount(awa.session(), awa.username().toUpperCase()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/auth/me").session(awa.session())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/users/" + awa.username())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/users/deleted-" + awa.id())).andExpect(status().isNotFound());

        mvc.perform(get("/api/v1/questions/" + questionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(1))
                .andExpect(jsonPath("$.author.deleted").value(true))
                .andExpect(jsonPath("$.author.displayName").value("Utilisateur supprimé"))
                .andExpect(jsonPath("$.author.username").value("deleted-" + awa.id()))
                .andExpect(jsonPath("$.author.countryCode").doesNotExist())
                .andExpect(jsonPath("$.author.reputation").value(0));

        Map<String, Object> row = jdbc.queryForMap(
                "select email, password_hash, status, reputation from users where id = ?", awa.id());
        assertThat(row.get("email")).isNull();
        assertThat(row.get("password_hash")).isNull();
        assertThat(row.get("status")).isEqualTo("DELETED");
        assertThat(row.get("reputation")).isEqualTo(0);
        assertThat(jdbc.queryForObject("select count(*) from reputation_events where user_id = ?", Long.class,
                awa.id())).isZero();

        mvc.perform(login(awa.email()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        // L'email est libéré : la personne peut revenir avec un compte neuf.
        mvc.perform(post("/api/v1/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("displayName", "Awa Ndiaye", "email", awa.email(),
                                "countryCode", "SN", "password", PASSWORD))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reputation").value(0));
    }

    @Test
    void lesAutresSessionsSontFermees() throws Exception {
        Member awa = register("Awa");
        var other = (MockHttpSession) mvc.perform(login(awa.email()))
                .andExpect(status().isOk()).andReturn().getRequest().getSession(false);

        mvc.perform(deleteAccount(awa.session(), awa.username())).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/auth/me").session(other)).andExpect(status().isUnauthorized());
    }

    @Test
    void uneSuspensionFermeLaSessionOuverte() throws Exception {
        Member awa = register("Awa");
        jdbc.update("update users set status = 'SUSPENDED' where id = ?", awa.id());

        mvc.perform(get("/api/v1/auth/me").session(awa.session())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/questions")).andExpect(status().isOk());
    }

    private RequestBuilder deleteAccount(MockHttpSession session, String confirmation) throws Exception {
        return delete("/api/v1/users/me").with(csrf()).session(session)
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", confirmation)));
    }

    private RequestBuilder login(String email) throws Exception {
        return post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("email", email, "password", PASSWORD)));
    }
}
