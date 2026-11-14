package dev.zetsu;

import org.junit.jupiter.api.Test;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Contrat du sprint 3 publié avant le code : modération, back office, défis, photo de profil et comptes
 * connectés. Les points d'entrée existent, répondent 501 tant qu'ils ne sont pas codés, et les règles d'accès
 * par rôle sont déjà en place (celles par niveau viendront avec le code).
 */
class SprintThreeContractTest extends IntegrationTest {

    @Test
    void lesPointsDEntreeSontPublies() throws Exception {
        mvc.perform(get("/api/v1/openapi.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/reports'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/moderation/cases'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/moderation/cases/{id}/decision'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/moderation/cases/{id}/appeal'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/moderation'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/cases'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/cases/{id}/decision'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/users'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/users/{id}/suspend'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/users/{id}/reactivate'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/users/{id}/role'].put").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/tags'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/tags'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/tags/{name}/merge'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/tags/{name}'].delete").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/challenges'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/challenges/{id}'].put").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/challenges/{id}/submissions'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/submissions/{id}/review'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/challenges/current'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/challenges/{id}/submissions'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/challenges/{id}/leaderboard'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/avatar'].put.requestBody.content['multipart/form-data']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/avatar'].delete").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/connections'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/connections/{provider}'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/connections/{provider}'].delete").exists());
    }

    @Test
    void lesDefisSontPublics() throws Exception {
        mvc.perform(get("/api/v1/challenges/999999/leaderboard"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CHALLENGE_NOT_FOUND"));
        mvc.perform(get("/api/v1/users/awa/avatar/photo.webp"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AVATAR_NOT_FOUND"));
    }

    @Test
    void lesActionsDesMembresDemandentUneSession() throws Exception {
        for (String path : new String[]{"/api/v1/moderation/cases", "/api/v1/users/me/moderation",
                "/api/v1/users/me/connections"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/reports").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/challenges/4/submissions").with(csrf())).andExpect(status().isUnauthorized());
    }

    @Test
    void leBackOfficeEstReserveALEquipe() throws Exception {
        Member awa = register("Awa");
        for (String path : new String[]{"/api/v1/admin/cases", "/api/v1/admin/users", "/api/v1/admin/tags",
                "/api/v1/admin/challenges"}) {
            mvc.perform(get(path).session(awa.session()))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }

        Member rimvie = register("Rimvie");
        jdbc.update("update users set role = 'MODERATOR' where id = ?", rimvie.id());
        Member moderator = login(rimvie);
        for (String path : new String[]{"/api/v1/admin/cases", "/api/v1/admin/users", "/api/v1/admin/tags",
                "/api/v1/admin/challenges"}) {
            mvc.perform(get(path).session(moderator.session())).andExpect(status().isOk());
        }
    }
}
