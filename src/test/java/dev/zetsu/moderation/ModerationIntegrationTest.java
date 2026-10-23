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

class ModerationIntegrationTest extends IntegrationTest {

    private static final String TITLE = "Passerelle Orange Money à frais réduits, contactez-nous sur WhatsApp";
    private static final String BODY = "Nous proposons une passerelle de paiement Orange Money avec des frais réduits garantis, écrivez-nous vite.";
    private static final String ANSWER = "Passez par notre passerelle, frais réduits garantis, contactez-nous sur WhatsApp.";
    private static final int MEMBER = 60;
    private static final int CONTRIBUTOR = 600;
    private static final int REFERENT = 1600;

    private ResultActions report(Member reporter, String type, long id) throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("targetType", type, "targetId", id, "reason", "SPAM"));
        req.put("comment", "Publicité répétée sous plusieurs questions");
        return mvc.perform(post("/api/v1/reports").with(csrf()).session(reporter.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(req)));
    }

    private long reportedBy(int reporters, String type, long id) throws Exception {
        long caseId = 0;
        for (int i = 0; i < reporters; i++) {
            Member m = withReputation(register("Signaleur"), MEMBER);
            caseId = read(report(m, type, id).andExpect(status().isCreated()).andReturn()).get("caseId").asLong();
        }
        return caseId;
    }

    private ResultActions decide(Member referent, long caseId, String action, String note) throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("action", action));
        req.put("note", note);
        return mvc.perform(post("/api/v1/moderation/cases/" + caseId + "/decision").with(csrf())
                .session(referent.session()).contentType(MediaType.APPLICATION_JSON).content(body(req)));
    }

    /** La base est partagée entre les tests : on cherche le dossier dans la file plutôt qu'en tête. */
    private JsonNode inQueue(Member viewer, long caseId) throws Exception {
        JsonNode page = read(mvc.perform(get("/api/v1/moderation/cases").param("size", "50").session(viewer.session()))
                .andExpect(status().isOk()).andReturn());
        for (JsonNode item : page.get("items")) {
            if (item.get("id").asLong() == caseId) {
                return item;
            }
        }
        return null;
    }

    private long answer(Member author, long questionId) throws Exception {
        return read(mvc.perform(post("/api/v1/questions/" + questionId + "/answers").with(csrf())
                        .session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("body", ANSWER))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    @Test
    void signalerDemandeLeNiveauMembreEtUneSeuleFois() throws Exception {
        Member spammer = register("Cheikh");
        long questionId = askQuestion(spammer, TITLE, BODY, "SN");

        Member newcomer = register("Awa");
        report(newcomer, "QUESTION", questionId)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LEVEL_TOO_LOW"));

        withReputation(spammer, MEMBER);
        report(spammer, "QUESTION", questionId)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_REPORT_OWN"));

        Member fatou = withReputation(register("Fatou"), MEMBER);
        report(fatou, "QUESTION", 999_999)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TARGET_NOT_FOUND"));
        report(fatou, "QUESTION", questionId)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hidden").value(false));
        report(fatou, "QUESTION", questionId)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_REPORTED"));
    }

    @Test
    void cinqSignalementsMasquentLeContenuSaufPourSonAuteur() throws Exception {
        Member spammer = register("Cheikh");
        long questionId = askQuestion(spammer, TITLE, BODY, "SN");
        reportedBy(4, "QUESTION", questionId);
        mvc.perform(get("/api/v1/questions/" + questionId)).andExpect(status().isOk());

        Member fifth = withReputation(register("Kofi", "GH"), MEMBER);
        report(fifth, "QUESTION", questionId).andExpect(jsonPath("$.hidden").value(true));

        mvc.perform(get("/api/v1/questions/" + questionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
        mvc.perform(get("/api/v1/questions/" + questionId).session(fifth.session())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/questions").param("author", spammer.username()))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/questions/" + questionId).session(spammer.session())).andExpect(status().isOk());
        Member moderator = withRole(register("Rimvie"), "MODERATOR");
        mvc.perform(get("/api/v1/questions/" + questionId).session(moderator.session())).andExpect(status().isOk());

        // L'auteur est prévenu sans savoir qui a signalé, et retrouve son contenu dans « mes contenus masqués ».
        mvc.perform(get("/api/v1/notifications").session(spammer.session()))
                .andExpect(jsonPath("$.items[0].type").value("CONTENT_HIDDEN"))
                .andExpect(jsonPath("$.items[0].actor").doesNotExist())
                .andExpect(jsonPath("$.items[0].target.type").value("QUESTION"))
                .andExpect(jsonPath("$.items[0].target.id").value(questionId));
        mvc.perform(get("/api/v1/users/me/moderation").session(spammer.session()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].status").value("HIDDEN"))
                .andExpect(jsonPath("$.items[0].target.title").value(TITLE))
                .andExpect(jsonPath("$.items[0].decision").doesNotExist())
                .andExpect(jsonPath("$.items[0].canAppeal").value(true));
    }

    @Test
    void laFileEstOuverteAuxContributeursEtTraiteeParLesReferents() throws Exception {
        Member spammer = register("Cheikh");
        long questionId = askQuestion(spammer, TITLE, BODY, "SN");
        long caseId = reportedBy(2, "QUESTION", questionId);

        Member member = withReputation(register("Moussa", "ML"), MEMBER);
        mvc.perform(get("/api/v1/moderation/cases").session(member.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LEVEL_TOO_LOW"));

        Member contributor = withReputation(register("Wanjiru", "KE"), CONTRIBUTOR);
        JsonNode queued = inQueue(contributor, caseId);
        assertThat(queued.get("status").asText()).isEqualTo("OPEN");
        assertThat(queued.get("reportCount").asInt()).isEqualTo(2);
        assertThat(queued.at("/reasons/0/reason").asText()).isEqualTo("SPAM");
        assertThat(queued.at("/reasons/0/count").asInt()).isEqualTo(2);
        assertThat(queued.at("/comments/0").asText()).isEqualTo("Publicité répétée sous plusieurs questions");
        assertThat(queued.at("/target/title").asText()).isEqualTo(TITLE);
        assertThat(queued.at("/target/author/username").asText()).isEqualTo(spammer.username());
        decide(contributor, caseId, "HIDE", "Publicité")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LEVEL_TOO_LOW"));

        // L'auteur ne voit jamais les dossiers de ses propres contenus, même Référent.
        withReputation(spammer, REFERENT);
        assertThat(inQueue(spammer, caseId)).isNull();
        decide(spammer, caseId, "DISMISS", null)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_MODERATE_OWN"));

        Member referent = withReputation(register("Kwame", "GH"), REFERENT);
        decide(referent, caseId, "SUSPEND", "Spam")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ACTION_NOT_ALLOWED"));
        decide(referent, caseId, "HIDE", "  ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOTE_REQUIRED"));
        decide(referent, caseId, "HIDE", "Publicité pour un service de paiement")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN"))
                .andExpect(jsonPath("$.decision.action").value("HIDE"))
                .andExpect(jsonPath("$.decision.note").value("Publicité pour un service de paiement"))
                .andExpect(jsonPath("$.decision.byTeam").value(false));
        mvc.perform(get("/api/v1/questions/" + questionId)).andExpect(status().isNotFound());
        decide(referent, caseId, "DISMISS", null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CASE_ALREADY_DECIDED"));
        assertThat(inQueue(referent, caseId)).isNull();
        mvc.perform(get("/api/v1/notifications").session(spammer.session()))
                .andExpect(jsonPath("$.items[0].type").value("CONTENT_HIDDEN"))
                .andExpect(jsonPath("$.items[0].actor").doesNotExist());
    }

    @Test
    void ignorerRendUnContenuMasqueAutomatiquementEtDeNouveauxSignalementsLeRemettentDansLaFile() throws Exception {
        Member author = register("Aminata");
        long questionId = askQuestion(author, "Quel opérateur choisir pour encaisser au Sénégal et en Côte d'Ivoire ?",
                "Je dois encaisser des paiements au Sénégal et en Côte d'Ivoire, quel opérateur couvre les deux pays ?",
                "SN");
        long caseId = reportedBy(5, "QUESTION", questionId);
        mvc.perform(get("/api/v1/questions/" + questionId)).andExpect(status().isNotFound());

        Member referent = withReputation(register("Kwame", "GH"), REFERENT);
        decide(referent, caseId, "DISMISS", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISMISSED"));
        mvc.perform(get("/api/v1/questions/" + questionId)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/notifications").session(author.session()))
                .andExpect(jsonPath("$.items[0].type").value("CONTENT_RESTORED"));

        // Un nouveau signalement rouvre le dossier sans décision, mais ne masque pas d'office.
        reportedBy(1, "QUESTION", questionId);
        JsonNode reopened = inQueue(referent, caseId);
        assertThat(reopened.get("status").asText()).isEqualTo("OPEN");
        assertThat(reopened.get("reportCount").asInt()).isEqualTo(6);
        assertThat(reopened.get("decision").isNull()).isTrue();
        mvc.perform(get("/api/v1/questions/" + questionId)).andExpect(status().isOk());
    }

    @Test
    void lAuteurContesteUneSeuleFois() throws Exception {
        Member author = register("Awa", "CI");
        long questionId = askQuestion(author, "Le SDK Wave gère-t-il la signature des webhooks ?",
                "Je vois un exemple qui appelle l'API Wave en HTTP brut, le SDK officiel vérifie-t-il la signature ?",
                "CI");
        long caseId = reportedBy(1, "QUESTION", questionId);
        Map<String, String> appeal = Map.of("message",
                "Le lien pointe vers la documentation officielle de l'API Wave, pas vers une offre commerciale.");
        String path = "/api/v1/moderation/cases/" + caseId + "/appeal";

        mvc.perform(post(path).with(csrf()).session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(appeal)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CASE_NOT_HIDDEN"));

        decide(withReputation(register("Kwame", "GH"), REFERENT), caseId, "HIDE", "Lien commercial")
                .andExpect(status().isOk());
        Member other = withReputation(register("Chidi", "NG"), MEMBER);
        mvc.perform(post(path).with(csrf()).session(other.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(appeal)))
                .andExpect(status().isForbidden());
        mvc.perform(post(path).with(csrf()).session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(appeal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPEALED"))
                .andExpect(jsonPath("$.decision.note").value("Lien commercial"))
                .andExpect(jsonPath("$.canAppeal").value(false));
        mvc.perform(post(path).with(csrf()).session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(appeal)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_APPEALED"));
        mvc.perform(get("/api/v1/users/me/moderation").session(author.session()))
                .andExpect(jsonPath("$.items[0].status").value("APPEALED"));
    }

    @Test
    void uneReponseMasqueeDisparaitDeLaListeSaufPourSonAuteur() throws Exception {
        Member asker = register("Aminata");
        long questionId = askQuestion(asker, "Comment vérifier une notification de paiement Orange Money ?",
                "Je reçois la notification Orange Money sur mon webhook mais comment être sûre qu'elle vient d'Orange ?",
                "SN");
        Member spammer = register("Cheikh");
        long answerId = answer(spammer, questionId);
        reportedBy(5, "ANSWER", answerId);

        mvc.perform(get("/api/v1/questions/" + questionId + "/answers"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/questions/" + questionId + "/answers").session(spammer.session()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(answerId));
        Member voter = withReputation(register("Kofi", "GH"), MEMBER);
        mvc.perform(post("/api/v1/answers/" + answerId + "/votes").with(csrf()).session(voter.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("value", 1))))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/notifications").session(spammer.session()))
                .andExpect(jsonPath("$.items[0].type").value("CONTENT_HIDDEN"))
                .andExpect(jsonPath("$.items[0].target.type").value("ANSWER"))
                .andExpect(jsonPath("$.items[0].target.questionId").value(questionId))
                .andExpect(jsonPath("$.items[0].target.title").value("Comment vérifier une notification de paiement Orange Money ?"));
    }

    @Test
    void unProfilMasqueNestPlusVisible() throws Exception {
        Member spammer = register("Cheikh");
        reportedBy(5, "USER", spammer.id());
        mvc.perform(get("/api/v1/users/" + spammer.username()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
        mvc.perform(get("/api/v1/users/" + spammer.username()).session(spammer.session())).andExpect(status().isOk());
    }
}
