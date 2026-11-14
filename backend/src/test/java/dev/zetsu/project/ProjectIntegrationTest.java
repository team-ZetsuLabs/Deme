package dev.zetsu.project;

import com.fasterxml.jackson.databind.JsonNode;
import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Espace Projets : critères d'acceptation de la section 5.5 et règles de la section 5.2. */
class ProjectIntegrationTest extends IntegrationTest {

    private static final String DESCRIPTION = "Une application pour gérer les cotisations d'une tontine entre "
            + "collègues : rappels par SMS, paiement par Orange Money ou Wave, historique partagé.";

    @Autowired
    private ProjectService projectService;

    @AfterEach
    void resetClock() {
        projectService.setClock(Clock.systemUTC());
    }

    private Map<String, Object> project(String title) {
        Map<String, Object> req = new HashMap<>(Map.of("title", title, "description", DESCRIPTION,
                "type", "STARTUP", "technologies", List.of("flutter", "firebase"),
                "roles", List.of(Map.of("title", "Développeur mobile Flutter", "technologies", List.of("flutter")),
                        Map.of("title", "Designer UX", "technologies", List.of("figma")))));
        req.put("githubUrl", "https://github.com/tontine-cash/app");
        req.put("contactUrl", "https://discord.gg/tontinecash");
        return req;
    }

    private JsonNode publish(Member owner, String title) throws Exception {
        return read(mvc.perform(post("/api/v1/projects").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(project(title))))
                .andExpect(status().isCreated()).andReturn());
    }

    private ResultActions ask(Member candidate, long projectId, long roleId) throws Exception {
        return mvc.perform(post("/api/v1/projects/{id}/requests", projectId).with(csrf()).session(candidate.session())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("roleId", roleId, "message", "Je fais du Flutter depuis deux ans à Dakar."))));
    }

    private long askId(Member candidate, long projectId, long roleId) throws Exception {
        return read(ask(candidate, projectId, roleId).andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private ResultActions decide(Member owner, long projectId, long requestId, String decision) throws Exception {
        return mvc.perform(patch("/api/v1/projects/{id}/requests/{r}", projectId, requestId).with(csrf())
                .session(owner.session()).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("status", decision))));
    }

    private int reputationOf(Member member) throws Exception {
        return read(mvc.perform(get("/api/v1/auth/me").session(member.session())).andReturn()).get("reputation").asInt();
    }

    private ResultActions notificationsOf(Member member) throws Exception {
        return mvc.perform(get("/api/v1/notifications").param("size", "50").session(member.session()));
    }

    @Test
    void unProjectDuDebutALaCloture() throws Exception {
        Member awa = register("Awa");
        Member kofi = register("Kofi", "GH");
        Member chidi = register("Chidi", "NG");

        // Publié avec 2 rôles : il apparaît dans la liste et sur le profil du porteur.
        JsonNode p = publish(awa, "Tontine Cash, cotisations en mobile money");
        long id = p.get("id").asLong();
        long flutter = p.get("roles").get(0).get("id").asLong();
        long designer = p.get("roles").get(1).get("id").asLong();
        mvc.perform(get("/api/v1/projects").param("size", "50"))
                .andExpect(jsonPath("$.items[*].id", hasItem((int) id)));
        mvc.perform(get("/api/v1/projects").param("member", awa.username()))
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].status").value("OPEN"))
                .andExpect(jsonPath("$.items[0].openRoles", hasSize(2)))
                .andExpect(jsonPath("$.items[0].teamSize").value(1));

        // Un autre membre demande un rôle : le porteur est notifié.
        long kofiRequest = askId(kofi, id, flutter);
        notificationsOf(awa).andExpect(jsonPath(
                "$.items[?(@.type == 'PROJECT_REQUEST_RECEIVED' && @.target.id == " + id + ")]", hasSize(1)));
        // Une seule demande en attente par membre et par projet, même sur un autre rôle.
        ask(kofi, id, designer).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_REQUESTED"));
        long chidiRequest = askId(chidi, id, flutter);

        // Le porteur accepte : le rôle est pourvu, le candidat est dans l'équipe et notifié.
        decide(awa, id, kofiRequest, "ACCEPTED").andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
        mvc.perform(get("/api/v1/projects/{id}", id).session(kofi.session()))
                .andExpect(jsonPath("$.roles[0].status").value("FILLED"))
                .andExpect(jsonPath("$.roles[0].member.username").value(kofi.username()))
                .andExpect(jsonPath("$.team", hasSize(2)))
                .andExpect(jsonPath("$.team[0].owner").value(true))
                .andExpect(jsonPath("$.team[1].member.username").value(kofi.username()))
                .andExpect(jsonPath("$.team[1].roleTitle").value("Développeur mobile Flutter"))
                .andExpect(jsonPath("$.myRequest.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.canPostUpdate").value(true))
                .andExpect(jsonPath("$.canEdit").value(false));
        notificationsOf(kofi).andExpect(jsonPath(
                "$.items[?(@.type == 'PROJECT_REQUEST_DECIDED' && @.outcome == 'ACCEPTED')]", hasSize(1)));

        // L'autre demande sur ce rôle est refusée d'office ; une nouvelle demande reçoit un message clair.
        notificationsOf(chidi).andExpect(jsonPath(
                "$.items[?(@.type == 'PROJECT_REQUEST_DECIDED' && @.outcome == 'REFUSED')]", hasSize(1)));
        decide(awa, id, chidiRequest, "ACCEPTED").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REQUEST_NOT_PENDING"));
        ask(register("Yao", "CI"), id, flutter).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ROLE_FILLED"))
                .andExpect(jsonPath("$.message").value("Ce rôle est déjà pourvu"));

        // Le fil : l'équipe écrit, les autres lisent.
        mvc.perform(post("/api/v1/projects/{id}/updates", id).with(csrf()).session(kofi.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("text", "Écran de cotisation terminé, <b>paiement Wave</b> branché."))))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/projects/{id}/updates", id).with(csrf()).session(chidi.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("text", "Je peux aider ?"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_PROJECT_MEMBER"));
        mvc.perform(get("/api/v1/projects/{id}/updates", id))
                .andExpect(jsonPath("$.items[0].text").value("Écran de cotisation terminé, <b>paiement Wave</b> branché."))
                .andExpect(jsonPath("$.items[0].author.username").value(kofi.username()));

        // Clôture : chaque membre accepté gagne 10 points ; le projet reste sur son profil.
        int before = reputationOf(kofi);
        int ownerBefore = reputationOf(awa);
        mvc.perform(post("/api/v1/projects/{id}/close", id).with(csrf()).session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.canEdit").value(false));
        assertThat(reputationOf(kofi)).isEqualTo(before + 10);
        assertThat(reputationOf(awa)).isEqualTo(ownerBefore);
        notificationsOf(kofi).andExpect(jsonPath("$.items[?(@.type == 'PROJECT_CLOSED')]", hasSize(1)));
        mvc.perform(get("/api/v1/projects").param("member", kofi.username()))
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].status").value("CLOSED"));
        mvc.perform(get("/api/v1/projects").param("size", "50"))
                .andExpect(jsonPath("$.items[*].id", not(hasItem((int) id))));

        // Clôturé : plus rien ne bouge, et pas de double gain.
        mvc.perform(post("/api/v1/projects/{id}/close", id).with(csrf()).session(awa.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_CLOSED"));
        assertThat(reputationOf(kofi)).isEqualTo(before + 10);
    }

    @Test
    void lePorteurNePeutPasSePorterCandidat() throws Exception {
        Member fatou = register("Fatou");
        JsonNode p = publish(fatou, "Annuaire des développeurs de Thiès");
        ask(fatou, p.get("id").asLong(), p.get("roles").get(0).get("id").asLong())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_JOIN_OWN"));
    }

    @Test
    void quitterOuEtreRetireRouvreLeRole() throws Exception {
        Member owner = register("Moussa", "ML");
        Member ama = register("Ama", "GH");
        Member ibrahim = register("Ibrahim", "NE");
        JsonNode p = publish(owner, "Bibliothèque USSD pour Node.js");
        long id = p.get("id").asLong();
        long r1 = p.get("roles").get(0).get("id").asLong();
        long r2 = p.get("roles").get(1).get("id").asLong();
        decide(owner, id, askId(ama, id, r1), "ACCEPTED").andExpect(status().isOk());
        decide(owner, id, askId(ibrahim, id, r2), "ACCEPTED").andExpect(status().isOk());
        mvc.perform(get("/api/v1/projects/{id}", id)).andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mvc.perform(post("/api/v1/projects/{id}/leave", id).with(csrf()).session(ama.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.roles[0].status").value("OPEN"))
                .andExpect(jsonPath("$.team", hasSize(2)));

        mvc.perform(post("/api/v1/projects/{id}/members/{u}/remove", id, ibrahim.username()).with(csrf())
                        .session(owner.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("reason", "Plus de nouvelles depuis trois semaines"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.team", hasSize(1)));
        mvc.perform(get("/api/v1/users/me/project-requests").session(ibrahim.session()))
                .andExpect(jsonPath("$.items[0].status").value("LEFT"))
                .andExpect(jsonPath("$.items[0].removalReason").value("Plus de nouvelles depuis trois semaines"));
        notificationsOf(ibrahim).andExpect(jsonPath("$.items[?(@.type == 'PROJECT_MEMBER_REMOVED')]", hasSize(1)));

        // Un rôle pourvu ne se retire pas ; un rôle ouvert, si.
        decide(owner, id, askId(ama, id, r1), "ACCEPTED").andExpect(status().isOk());
        mvc.perform(delete("/api/v1/projects/{id}/roles/{r}", id, r1).with(csrf()).session(owner.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ROLE_FILLED"));
        mvc.perform(delete("/api/v1/projects/{id}/roles/{r}", id, r2).with(csrf()).session(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasSize(1)))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void retirerSaDemandeEnAttente() throws Exception {
        Member owner = register("Aicha");
        Member yao = register("Yao", "CI");
        JsonNode p = publish(owner, "Traduction de la doc de Laravel en wolof");
        long id = p.get("id").asLong();
        long requestId = askId(yao, id, p.get("roles").get(0).get("id").asLong());
        mvc.perform(delete("/api/v1/projects/{id}/requests/{r}", id, requestId).with(csrf()).session(owner.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_REQUEST_AUTHOR"));
        mvc.perform(delete("/api/v1/projects/{id}/requests/{r}", id, requestId).with(csrf()).session(yao.session()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/projects/{id}/requests", id).session(owner.session()))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void retirerSaDemandeSansConnaitreSonIdentifiant() throws Exception {
        Member owner = register("Fatou");
        Member kwame = register("Kwame", "GH");
        JsonNode p = publish(owner, "Annuaire des développeurs freelance de Lomé");
        long id = p.get("id").asLong();
        long roleId = p.get("roles").get(1).get("id").asLong();
        askId(kwame, id, roleId);
        // La page du projet donne au candidat de quoi réafficher sa demande.
        mvc.perform(get("/api/v1/projects/{id}", id).session(kwame.session()))
                .andExpect(jsonPath("$.myRequest.status").value("PENDING"))
                .andExpect(jsonPath("$.myRequest.roleId").value(roleId))
                .andExpect(jsonPath("$.myRequest.roleTitle").value("Designer UX"))
                .andExpect(jsonPath("$.myRequest.message").value("Je fais du Flutter depuis deux ans à Dakar."))
                .andExpect(jsonPath("$.myRequest.createdAt").isNotEmpty());
        mvc.perform(get("/api/v1/users/me/project-requests").session(kwame.session()))
                .andExpect(jsonPath("$.items[0].roleId").value(roleId));

        mvc.perform(delete("/api/v1/projects/{id}/requests/me", id).with(csrf()).session(kwame.session()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/projects/{id}/requests/me", id).with(csrf()).session(kwame.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("REQUEST_NOT_FOUND"));
        mvc.perform(get("/api/v1/projects/{id}/requests", id).session(owner.session()))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void mesProjetsPorteEtRejoints() throws Exception {
        Member owner = register("Ousmane");
        Member nadia = register("Nadia", "MA");
        JsonNode p = publish(owner, "Passerelle SMS pour coopératives agricoles");
        long id = p.get("id").asLong();
        long other = publish(register("Ibrahim", "NE"), "Outil de suivi des forages au Niger").get("id").asLong();
        long requestId = askId(nadia, id, p.get("roles").get(0).get("id").asLong());
        decide(owner, id, requestId, "ACCEPTED").andExpect(status().isOk());

        mvc.perform(get("/api/v1/projects/mine")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/projects/mine").session(owner.session()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(id));
        mvc.perform(get("/api/v1/projects/mine").session(nadia.session()))
                .andExpect(jsonPath("$.items[*].id", hasItem((int) id)))
                .andExpect(jsonPath("$.items[*].id", not(hasItem((int) other))));
    }

    @Test
    void lesDemandesRecuesSontReserveesAuPorteur() throws Exception {
        Member owner = register("Aminata");
        long id = publish(owner, "Comparateur de forfaits internet au Sénégal").get("id").asLong();
        mvc.perform(get("/api/v1/projects/{id}/requests", id)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/projects/{id}/requests", id).session(register("Mariam").session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_PROJECT_OWNER"));
    }

    @Test
    void enPauseApres60JoursSansActivite() throws Exception {
        Member owner = register("Kwame", "GH");
        long id = publish(owner, "Carte des points de retrait MTN MoMo").get("id").asLong();
        projectService.setClock(Clock.fixed(Instant.now().plus(Duration.ofDays(61)), ZoneOffset.UTC));
        projectService.pauseInactive();
        mvc.perform(get("/api/v1/projects/{id}", id)).andExpect(jsonPath("$.status").value("PAUSED"));
        ask(register("Ama", "GH"), id, read(mvc.perform(get("/api/v1/projects/{id}", id)).andReturn())
                .get("roles").get(0).get("id").asLong())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_OPEN"));

        // Une action du porteur relance le projet.
        Map<String, Object> edit = new HashMap<>(project("Carte des points de retrait MTN MoMo à Kumasi"));
        edit.remove("roles");
        mvc.perform(put("/api/v1/projects/{id}", id).with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(edit)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void liensEtContenusPieges() throws Exception {
        Member owner = register("Chidi", "NG");
        Map<String, Object> req = project("<script>alert(1)</script> projet piégé");
        req.put("contactUrl", "javascript:alert(1)");
        req.put("githubUrl", "https://evil.example/repo");
        mvc.perform(post("/api/v1/projects").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.contactUrl").exists())
                .andExpect(jsonPath("$.fields.githubUrl").exists());

        req = project("Projet avec une description piégée");
        req.put("description", DESCRIPTION + " <img src=x onerror=alert(1)>");
        mvc.perform(post("/api/v1/projects").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descriptionHtml", not(containsString("<img"))));
    }

    @Test
    void unProjetSeSignaleEtSeMasque() throws Exception {
        Member owner = register("Ousmane", "SN");
        long id = publish(owner, "Plateforme de paris en ligne garantis").get("id").asLong();
        for (int i = 0; i < 5; i++) {
            Member reporter = withReputation(register("Signaleur"), 60);
            mvc.perform(post("/api/v1/reports").with(csrf()).session(reporter.session())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body(Map.of("targetType", "PROJECT", "targetId", id, "reason", "SPAM"))))
                    .andExpect(status().isCreated());
        }
        mvc.perform(get("/api/v1/projects/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/projects/{id}", id).session(owner.session())).andExpect(status().isOk());
        mvc.perform(get("/api/v1/projects").param("member", owner.username()))
                .andExpect(jsonPath("$.total").value(0));
        notificationsOf(owner).andExpect(jsonPath("$.items[?(@.type == 'CONTENT_HIDDEN')]", hasSize(1)));
    }

    @Test
    void unCompteSupprimeQuitteSesEquipesEtClotureSesProjets() throws Exception {
        Member owner = register("Seydou", "SN");
        Member member = register("Adama", "SN");
        JsonNode p = publish(owner, "Application de covoiturage entre Dakar et Thiès");
        long id = p.get("id").asLong();
        decide(owner, id, askId(member, id, p.get("roles").get(0).get("id").asLong()), "ACCEPTED")
                .andExpect(status().isOk());

        mvc.perform(delete("/api/v1/users/me").with(csrf()).session(member.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", member.username()))))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/projects/{id}", id))
                .andExpect(jsonPath("$.team", hasSize(1)))
                .andExpect(jsonPath("$.roles[0].status").value("OPEN"))
                .andExpect(jsonPath("$.status").value("OPEN"));

        long other = publish(owner, "Suivi des colis entre Bamako et Dakar").get("id").asLong();
        mvc.perform(delete("/api/v1/users/me").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", owner.username()))))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/projects/{id}", id)).andExpect(jsonPath("$.status").value("CLOSED"));
        mvc.perform(get("/api/v1/projects/{id}", other)).andExpect(jsonPath("$.status").value("CLOSED"));
        // Une clôture par suppression de compte ne rapporte rien.
        assertThat(jdbc.queryForObject("select count(*) from reputation_events where project_id in (?, ?)",
                Integer.class, id, other)).isZero();
    }

    @Test
    void filtres() throws Exception {
        Member owner = register("Nana", "GH");
        long id = publish(owner, "Outil de facturation pour artisans de Kumasi").get("id").asLong();
        mvc.perform(get("/api/v1/projects").param("technology", "Figma").param("type", "STARTUP")
                        .param("role", "designer").param("openRoles", "true").param("size", "50"))
                .andExpect(jsonPath("$.items[*].id", hasItem((int) id)));
        mvc.perform(get("/api/v1/projects").param("role", "comptable%").param("size", "50"))
                .andExpect(jsonPath("$.items[*].id", not(hasItem((int) id))));
        mvc.perform(get("/api/v1/projects").param("type", "VOLUNTEER").param("size", "50"))
                .andExpect(jsonPath("$.items[*].id", not(hasItem((int) id))));
    }
}
