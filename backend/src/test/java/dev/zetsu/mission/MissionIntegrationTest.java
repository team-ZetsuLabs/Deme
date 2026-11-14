package dev.zetsu.mission;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.RequestBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MissionIntegrationTest extends IntegrationTest {

    private static final String DESCRIPTION = "Ma boutique tourne sous WooCommerce sur un hébergement mutualisé. "
            + "Je veux proposer Wave au paiement, avec la confirmation automatique de la commande.";
    private static final String PROPOSAL = "J'ai intégré Wave et Orange Money pour deux boutiques à Abidjan, "
            + "je peux livrer en 3 jours avec la gestion du paiement confirmé après fermeture de la page.";

    private static Map<String, Object> missionBody(String kind, List<String> technologies) {
        return new HashMap<>(Map.of("title", "Brancher Wave sur ma boutique WooCommerce", "description", DESCRIPTION,
                "kind", kind, "budget", Map.of("amount", 75000, "currency", "XOF"), "durationDays", 3,
                "technologies", technologies, "countryCode", "CI"));
    }

    private long createMission(Member author, Map<String, Object> body) throws Exception {
        return read(mvc.perform(post("/api/v1/missions").with(csrf()).session(author.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andReturn()).get("id").asLong();
    }

    private RequestBuilder propose(Member member, long missionId, Map<String, Object> req) throws Exception {
        return post("/api/v1/missions/" + missionId + "/applications").with(csrf()).session(member.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(req));
    }

    private RequestBuilder decide(Member member, long applicationId, String status) throws Exception {
        return patch("/api/v1/applications/" + applicationId).with(csrf()).session(member.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("status", status)));
    }

    @Test
    void unMembrePublieUneMissionVisibleDeTous() throws Exception {
        Member yao = register("Yao", "CI");
        String tech = "woo-" + System.nanoTime() % 1000000;
        long id = createMission(yao, missionBody("INTEGRATION", List.of("WooCommerce", "PHP", tech)));

        mvc.perform(get("/api/v1/missions/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies", contains("woocommerce", "php", tech)))
                .andExpect(jsonPath("$.budget.amount").value(75000))
                .andExpect(jsonPath("$.budget.currency").value("XOF"))
                .andExpect(jsonPath("$.author.username").value(yao.username()))
                .andExpect(jsonPath("$.applicationCount").value(0))
                .andExpect(jsonPath("$.canEdit").value(false));
        mvc.perform(get("/api/v1/missions/" + id).session(yao.session()))
                .andExpect(jsonPath("$.canEdit").value(true));

        mvc.perform(get("/api/v1/missions").param("technology", tech))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(id));
        mvc.perform(get("/api/v1/missions").param("technology", tech).param("kind", "CODE_REVIEW"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/missions").param("technology", tech).param("author", yao.username())
                        .param("country", "CI"))
                .andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/missions").param("country", "ZZ")).andExpect(status().isBadRequest());
    }

    @Test
    void validationDeLaMission() throws Exception {
        Member yao = register("Yao", "CI");
        Map<String, Object> body = missionBody("INTEGRATION", List.of());
        body.put("budget", Map.of("amount", -5, "currency", "fcfa"));
        body.put("durationDays", 120);
        mvc.perform(post("/api/v1/missions").with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields['budget.amount']").value("Montant positif attendu"))
                .andExpect(jsonPath("$.fields['budget.currency']").value("Code devise ISO 4217 attendu"))
                .andExpect(jsonPath("$.fields.durationDays").value("Entre 1 et 90 jours"));

        mvc.perform(post("/api/v1/missions").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(missionBody("OTHER", List.of()))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void parcoursDUneProposition() throws Exception {
        Member yao = register("Yao", "CI");
        Member aminata = register("Aminata", "SN");
        Member kwame = register("Kwame", "GH");
        long missionId = createMission(yao, missionBody("INTEGRATION", List.of("wave")));

        mvc.perform(propose(yao, missionId, Map.of("message", PROPOSAL)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_APPLY_OWN"));
        mvc.perform(propose(aminata, missionId, Map.of("message", "Je peux le faire.")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.message").value("Entre 40 et 2000 caractères"));

        long fromAminata = read(mvc.perform(propose(aminata, missionId,
                        Map.of("message", PROPOSAL, "proposedBudget", Map.of("amount", 70000, "currency", "XOF"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.target.type").value("MISSION"))
                .andExpect(jsonPath("$.target.companyName").doesNotExist())
                .andExpect(jsonPath("$.proposedBudget.amount").value(70000))
                .andExpect(jsonPath("$.hasCv").value(false))
                .andReturn()).get("id").asLong();
        mvc.perform(propose(aminata, missionId, Map.of("message", PROPOSAL)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_APPLIED"));
        mvc.perform(propose(kwame, missionId, Map.of("message", PROPOSAL))).andExpect(status().isCreated());

        mvc.perform(get("/api/v1/missions").param("author", yao.username()))
                .andExpect(jsonPath("$.items[0].applicationCount").value(2));
        mvc.perform(get("/api/v1/missions/" + missionId).session(aminata.session()))
                .andExpect(jsonPath("$.myApplication.id").value(fromAminata))
                .andExpect(jsonPath("$.applicationCount").value(2));

        mvc.perform(get("/api/v1/missions/" + missionId + "/applications").session(kwame.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_MISSION_AUTHOR"));
        mvc.perform(get("/api/v1/missions/" + missionId + "/applications").session(yao.session()))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].status").value("VIEWED"))
                .andExpect(jsonPath("$.items[1].candidate.username").value(aminata.username()));

        // Retenir une proposition met la mission en cours : plus de nouvelles propositions ni de modification.
        mvc.perform(decide(yao, fromAminata, "SHORTLISTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHORTLISTED"));
        mvc.perform(get("/api/v1/missions/" + missionId)).andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        mvc.perform(propose(register("Njeri", "KE"), missionId, Map.of("message", PROPOSAL)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("MISSION_NOT_OPEN"));
        mvc.perform(put("/api/v1/missions/" + missionId).with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(missionBody("INTEGRATION", List.of()))))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/v1/missions").param("author", yao.username()).param("status", "IN_PROGRESS"))
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(get("/api/v1/users/me/applications").param("type", "MISSION").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].status").value("SHORTLISTED"))
                .andExpect(jsonPath("$.items[0].target.id").value(missionId));
        mvc.perform(get("/api/v1/applications/" + fromAminata + "/cv").session(yao.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CV_NOT_FOUND"));

        mvc.perform(post("/api/v1/missions/" + missionId + "/close").with(csrf()).session(kwame.session()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/missions/" + missionId + "/close").with(csrf()).session(yao.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.canEdit").value(false));
    }

    @Test
    void laDescriptionEstNettoyeeEtLAuteurModifie() throws Exception {
        Member yao = register("Yao", "CI");
        long id = createMission(yao, missionBody("TROUBLESHOOTING", List.of()));
        Map<String, Object> body = missionBody("TROUBLESHOOTING", List.of("android"));
        body.put("description", DESCRIPTION + "\n\n<script>alert(1)</script><img src=x onerror=alert(1)>");

        mvc.perform(put("/api/v1/missions/" + id).with(csrf()).session(register("Kofi").session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(body)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_MISSION_AUTHOR"));
        mvc.perform(put("/api/v1/missions/" + id).with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies", contains("android")))
                .andExpect(jsonPath("$.descriptionHtml", not(containsString("<script"))))
                .andExpect(jsonPath("$.descriptionHtml", not(containsString("<img"))));
    }

    @Test
    void supprimerSonCompteClotSesMissions() throws Exception {
        Member yao = register("Yao", "CI");
        long id = createMission(yao, missionBody("OTHER", List.of()));

        mvc.perform(delete("/api/v1/users/me").with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", yao.username()))))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/missions/" + id))
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.author.deleted").value(true));
    }
}
