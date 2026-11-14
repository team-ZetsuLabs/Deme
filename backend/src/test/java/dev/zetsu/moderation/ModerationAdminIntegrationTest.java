package dev.zetsu.moderation;

import com.fasterxml.jackson.databind.JsonNode;
import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** MOD-4 : l'équipe tranche les contestations et peut avertir ou suspendre l'auteur d'un contenu. */
class ModerationAdminIntegrationTest extends IntegrationTest {

    private static final String BODY = "Je reçois la notification Wave sur mon webhook mais comment vérifier sa signature côté serveur ?";

    private long hiddenByReferent(Member author) throws Exception {
        long questionId = askQuestion(author, "Le SDK Wave vérifie-t-il la signature des webhooks ?", BODY, "CI");
        Member reporter = withReputation(register("Moussa", "ML"), 60);
        long caseId = read(mvc.perform(post("/api/v1/reports").with(csrf()).session(reporter.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetType", "QUESTION", "targetId", questionId, "reason", "SPAM"))))
                .andExpect(status().isCreated()).andReturn()).get("caseId").asLong();
        Member referent = withReputation(register("Kwame", "GH"), 1600);
        mvc.perform(post("/api/v1/moderation/cases/" + caseId + "/decision").with(csrf()).session(referent.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("action", "HIDE", "note", "Lien commercial"))))
                .andExpect(status().isOk());
        return caseId;
    }

    private void appeal(Member author, long caseId) throws Exception {
        mvc.perform(post("/api/v1/moderation/cases/" + caseId + "/appeal").with(csrf()).session(author.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("message", "Le lien pointe vers la documentation officielle de Wave."))))
                .andExpect(status().isOk());
    }

    private ResultActions teamDecide(Member staff, long caseId, String action, String note) throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("action", action));
        req.put("note", note);
        return mvc.perform(post("/api/v1/admin/cases/" + caseId + "/decision").with(csrf()).session(staff.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(req)));
    }

    private long questionOf(long caseId) {
        return jdbc.queryForObject("select target_id from moderation_cases where id = ?", Long.class, caseId);
    }

    @Test
    void lesContestationsArriventEnTeteEtUneContestationAccepteeRetablitLeContenu() throws Exception {
        Member author = register("Awa", "CI");
        long caseId = hiddenByReferent(author);
        appeal(author, caseId);
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");

        JsonNode first = read(mvc.perform(get("/api/v1/admin/cases").session(rimvie.session()))
                .andExpect(status().isOk()).andReturn()).at("/items/0");
        assertThat(first.get("status").asText()).isEqualTo("APPEALED");
        mvc.perform(get("/api/v1/admin/cases").param("status", "APPEALED").param("size", "50").session(rimvie.session()))
                .andExpect(jsonPath("$.items[?(@.id == " + caseId + ")].appeal")
                        .value("Le lien pointe vers la documentation officielle de Wave."));

        teamDecide(rimvie, caseId, "RESTORE", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESTORED"))
                .andExpect(jsonPath("$.decision.action").value("RESTORE"))
                .andExpect(jsonPath("$.decision.byTeam").value(true));
        mvc.perform(get("/api/v1/questions/" + questionOf(caseId))).andExpect(status().isOk());
        mvc.perform(get("/api/v1/notifications").session(author.session()))
                .andExpect(jsonPath("$.items[0].type").value("CONTENT_RESTORED"))
                .andExpect(jsonPath("$.items[0].actor").doesNotExist());
        mvc.perform(get("/api/v1/users/me/moderation").session(author.session()))
                .andExpect(jsonPath("$.items[0].status").value("RESTORED"))
                .andExpect(jsonPath("$.items[0].canAppeal").value(false));
    }

    @Test
    void uneContestationRejeteeLaisseLeContenuMasque() throws Exception {
        Member author = register("Awa", "CI");
        long caseId = hiddenByReferent(author);
        appeal(author, caseId);
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");

        teamDecide(rimvie, caseId, "HIDE", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOTE_REQUIRED"));
        teamDecide(rimvie, caseId, "HIDE", "Lien d'affiliation vers un service payant")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN"))
                .andExpect(jsonPath("$.decision.byTeam").value(true));
        mvc.perform(get("/api/v1/questions/" + questionOf(caseId))).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/users/me/moderation").session(author.session()))
                .andExpect(jsonPath("$.items[0].status").value("HIDDEN"))
                .andExpect(jsonPath("$.items[0].canAppeal").value(false));
    }

    @Test
    void avertirPuisSuspendreLAuteur() throws Exception {
        Member author = register("Cheikh");
        long caseId = hiddenByReferent(author);
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");

        teamDecide(rimvie, caseId, "WARN", "Premier avertissement : pas de liens commerciaux")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN"));
        mvc.perform(get("/api/v1/notifications").session(author.session()))
                .andExpect(jsonPath("$.items[0].type").value("ACCOUNT_WARNED"))
                .andExpect(jsonPath("$.items[0].target.type").value("USER"))
                .andExpect(jsonPath("$.items[0].target.id").value(author.id()));
        mvc.perform(get("/api/v1/admin/users").param("q", author.email()).session(rimvie.session()))
                .andExpect(jsonPath("$.items[0].warningCount").value(1))
                .andExpect(jsonPath("$.items[0].hiddenContentCount").value(1));

        teamDecide(rimvie, caseId, "SUSPEND", "Liens commerciaux répétés malgré un avertissement")
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/auth/me").session(author.session())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", author.email(), "password", PASSWORD))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_SUSPENDED"));
        mvc.perform(get("/api/v1/admin/users").param("q", author.email()).session(rimvie.session()))
                .andExpect(jsonPath("$.items[0].status").value("SUSPENDED"))
                .andExpect(jsonPath("$.items[0].suspensionReason")
                        .value("Liens commerciaux répétés malgré un avertissement"));
    }

    @Test
    void onNeSuspendPasUnMembreDeLEquipe() throws Exception {
        Member staffAuthor = register("Benhasser");
        long caseId = hiddenByReferent(staffAuthor);
        withRole(staffAuthor, "MODERATOR");
        Member rimvie = withRole(register("Rimvie"), "ADMIN");
        teamDecide(rimvie, caseId, "SUSPEND", "Test")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_SUSPEND_STAFF"));
    }
}
