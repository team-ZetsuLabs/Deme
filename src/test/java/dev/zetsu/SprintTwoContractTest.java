package dev.zetsu;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Contrat du sprint 2 publié avant le code : les points d'entrée existent, ceux qui ne sont pas encore codés
 * répondent 501, et les règles d'accès sont en place.
 */
class SprintTwoContractTest extends IntegrationTest {

    @Test
    void lesPointsDEntreeSontPublies() throws Exception {
        mvc.perform(get("/api/v1/openapi.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/jobs'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/jobs'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/jobs/mine'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/jobs/{id}'].put").exists())
                .andExpect(jsonPath("$.paths['/api/v1/jobs/{id}/close'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/jobs/{id}/applications'].post.requestBody.content['multipart/form-data']").exists())
                .andExpect(jsonPath("$.paths['/api/v1/jobs/{id}/applications'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/missions'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/missions/{id}/applications'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/applications/{id}'].patch").exists())
                .andExpect(jsonPath("$.paths['/api/v1/applications/{id}/cv'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/users/me/applications'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/admin/jobs/{id}/decision'].post").exists())
                .andExpect(jsonPath("$.paths['/api/v1/notifications'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/notifications/unread-count'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/notifications/read'].post").exists());
    }

    @Test
    void lesListesSontPubliques() throws Exception {
        mvc.perform(get("/api/v1/jobs")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/missions/7"))
                .andExpect(status().isNotImplemented())
                .andExpect(jsonPath("$.code").value("NOT_IMPLEMENTED"));
    }

    @Test
    void lesLecturesPriveesDemandentUneSession() throws Exception {
        for (String path : new String[]{"/api/v1/jobs/mine", "/api/v1/jobs/3/applications",
                "/api/v1/missions/3/applications", "/api/v1/users/me/applications", "/api/v1/notifications",
                "/api/v1/notifications/unread-count", "/api/v1/applications/3/cv"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    @Test
    void leBackOfficeEstReserveALEquipe() throws Exception {
        Member awa = register("Awa");
        mvc.perform(get("/api/v1/admin/jobs").session(awa.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));

        Member rimvie = register("Rimvie");
        jdbc.update("update users set role = 'MODERATOR' where id = ?", rimvie.id());
        Member moderator = login(rimvie);
        mvc.perform(get("/api/v1/admin/jobs").session(moderator.session())).andExpect(status().isOk());
    }
}
