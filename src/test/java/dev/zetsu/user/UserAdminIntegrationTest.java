package dev.zetsu.user;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** MOD-4 : comptes dans le back office. */
class UserAdminIntegrationTest extends IntegrationTest {

    @Test
    void rechercherSuspendreEtReactiver() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        Member kofi = register("Kofi", "GH");

        mvc.perform(get("/api/v1/admin/users").param("q", kofi.email().toUpperCase()).session(rimvie.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].username").value(kofi.username()))
                .andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.items[0].level").value("NEWCOMER"));

        String suspend = "/api/v1/admin/users/" + kofi.id() + "/suspend";
        mvc.perform(post(suspend).with(csrf()).session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("reason", " "))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.reason").exists());
        mvc.perform(post(suspend).with(csrf()).session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("reason", "Offres frauduleuses répétées"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.suspensionReason").value("Offres frauduleuses répétées"));
        mvc.perform(get("/api/v1/auth/me").session(kofi.session())).andExpect(status().isUnauthorized());
        mvc.perform(post(suspend).with(csrf()).session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("reason", "Encore"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_NOT_ACTIVE"));
        mvc.perform(get("/api/v1/admin/users").param("status", "SUSPENDED").param("q", kofi.username())
                        .session(rimvie.session()))
                .andExpect(jsonPath("$.total").value(1));

        String reactivate = "/api/v1/admin/users/" + kofi.id() + "/reactivate";
        mvc.perform(post(reactivate).with(csrf()).session(rimvie.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.suspensionReason").doesNotExist());
        login(kofi);
        mvc.perform(post(reactivate).with(csrf()).session(rimvie.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USER_NOT_SUSPENDED"));
    }

    @Test
    void onNeSuspendNiLEquipeNiSoiMeme() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        Member salif = withRole(register("Salif"), "ADMIN");
        for (Member target : new Member[]{rimvie, salif}) {
            mvc.perform(post("/api/v1/admin/users/" + target.id() + "/suspend").with(csrf()).session(rimvie.session())
                            .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("reason", "Test"))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("CANNOT_SUSPEND_STAFF"));
        }
    }

    @Test
    void seulUnAdministrateurChangeUnRoleEtCelaCompteSansReconnexion() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        Member salif = withRole(register("Salif"), "ADMIN");
        Member awa = register("Awa", "CI");
        String role = "/api/v1/admin/users/" + awa.id() + "/role";

        mvc.perform(put(role).with(csrf()).session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("role", "MODERATOR"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(put("/api/v1/admin/users/" + salif.id() + "/role").with(csrf()).session(salif.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("role", "MEMBER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_CHANGE_OWN_ROLE"));

        mvc.perform(get("/api/v1/admin/users").session(awa.session())).andExpect(status().isForbidden());
        mvc.perform(put(role).with(csrf()).session(salif.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("role", "MODERATOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MODERATOR"));
        // Même session, sans se reconnecter : le nouveau rôle compte dès la requête suivante.
        mvc.perform(get("/api/v1/admin/users").session(awa.session())).andExpect(status().isOk());
        mvc.perform(get("/api/v1/auth/me").session(awa.session())).andExpect(jsonPath("$.role").value("MODERATOR"));

        mvc.perform(put(role).with(csrf()).session(salif.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("role", "MEMBER"))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/users").session(awa.session())).andExpect(status().isForbidden());
    }
}
