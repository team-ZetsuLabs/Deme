package dev.zetsu.notification;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationIntegrationTest extends IntegrationTest {

    private static final String TITLE = "Comment vérifier une notification de paiement Orange Money ?";
    private static final String BODY = "Je reçois la notification Orange Money sur mon webhook mais comment être sûre qu'elle vient d'Orange ?";
    private static final String ANSWER = "Relis le statut avec l'API transactionstatus avant de créditer la commande.";
    private static final String MESSAGE = "Je construis des intégrations Orange Money depuis deux ans chez un agrégateur à Thiès.";

    private long count(MockHttpSession session) throws Exception {
        return read(mvc.perform(get("/api/v1/notifications/unread-count").session(session))
                .andExpect(status().isOk()).andReturn()).get("count").asLong();
    }

    private long answer(Member author, long questionId) throws Exception {
        return read(mvc.perform(post("/api/v1/questions/" + questionId + "/answers").with(csrf())
                        .session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("body", ANSWER))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private void onboard(Member member, List<String> stack) throws Exception {
        mvc.perform(put("/api/v1/users/me/onboarding").with(csrf()).session(member.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("technologies", stack, "countryCode", "SN", "language", "fr"))))
                .andExpect(status().isOk());
    }

    @Test
    void reponsesAcceptationEtVotes() throws Exception {
        Member aminata = register("Aminata");
        Member kwame = withReputation(register("Kwame", "GH"), 60);
        long questionId = askQuestion(aminata, TITLE, BODY, "SN");

        long answerId = answer(kwame, questionId);
        mvc.perform(get("/api/v1/notifications").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].type").value("ANSWER_POSTED"))
                .andExpect(jsonPath("$.items[0].read").value(false))
                .andExpect(jsonPath("$.items[0].actor.username").value(kwame.username()))
                .andExpect(jsonPath("$.items[0].target.type").value("ANSWER"))
                .andExpect(jsonPath("$.items[0].target.id").value(answerId))
                .andExpect(jsonPath("$.items[0].target.questionId").value(questionId))
                .andExpect(jsonPath("$.items[0].target.title").value(TITLE));

        mvc.perform(put("/api/v1/questions/" + questionId + "/accepted-answer").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("answerId", answerId))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/notifications").session(kwame.session()))
                .andExpect(jsonPath("$.items[0].type").value("ANSWER_ACCEPTED"))
                .andExpect(jsonPath("$.items[0].actor.username").value(aminata.username()));

        // Un vote retiré puis remis ne notifie qu'une fois.
        String vote = "/api/v1/questions/" + questionId + "/votes";
        for (int i = 0; i < 2; i++) {
            mvc.perform(post(vote).with(csrf()).session(kwame.session()).contentType(MediaType.APPLICATION_JSON)
                    .content(body(Map.of("value", 1)))).andExpect(status().isOk());
            mvc.perform(delete(vote).with(csrf()).session(kwame.session())).andExpect(status().isOk());
        }
        mvc.perform(get("/api/v1/notifications").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].type").value("VOTE_RECEIVED"))
                .andExpect(jsonPath("$.items[0].target.type").value("QUESTION"));

        // Répondre à sa propre question ne notifie personne.
        answer(aminata, questionId);
        mvc.perform(get("/api/v1/notifications").session(aminata.session())).andExpect(jsonPath("$.total").value(2));
    }

    @Test
    void marquerCommeLuNeTouchePasAuxNotificationsDesAutres() throws Exception {
        Member aminata = register("Aminata");
        Member kwame = register("Kwame", "GH");
        Member njeri = register("Njeri", "KE");
        long q1 = askQuestion(aminata, TITLE, BODY, "SN");
        long q2 = askQuestion(njeri, TITLE + " (Kenya)", BODY, "KE");
        answer(kwame, q1);
        answer(kwame, q1);
        answer(kwame, q2);
        assertCount(aminata, 2);

        long first = read(mvc.perform(get("/api/v1/notifications").session(aminata.session())).andReturn())
                .get("items").get(0).get("id").asLong();
        long fromNjeri = read(mvc.perform(get("/api/v1/notifications").session(njeri.session())).andReturn())
                .get("items").get(0).get("id").asLong();

        mvc.perform(post("/api/v1/notifications/read").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("ids", List.of(first, fromNjeri)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));
        assertCount(njeri, 1);
        mvc.perform(get("/api/v1/notifications").param("unreadOnly", "true").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(post("/api/v1/notifications/read").with(csrf()).session(aminata.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
        assertCount(njeri, 1);
    }

    @Test
    void offresMissionsEtCandidatures() throws Exception {
        String tech = "notif-" + System.nanoTime() % 1000000;
        Member fatou = withRole(register("Fatou"), "RECRUITER");
        Member moderator = withRole(register("Rimvie"), "MODERATOR");
        Member aminata = register("Aminata");
        Member kofi = register("Kofi", "GH");
        onboard(aminata, List.of(tech, "java"));
        onboard(kofi, List.of("python"));

        Map<String, Object> job = Map.of("title", "Développeur back-end Java, paiements mobiles",
                "companyName", "Sahel Pay", "type", "PERMANENT", "countryCode", "SN", "technologies", List.of(tech),
                "description", "Sahel Pay construit l'encaissement mobile money pour les commerçants d'Afrique de "
                        + "l'Ouest : API Orange Money et Wave, webhooks fiables, réconciliation quotidienne.");
        long jobId = read(mvc.perform(post("/api/v1/jobs").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(job)))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        assertCount(aminata, 0);
        mvc.perform(post("/api/v1/admin/jobs/" + jobId + "/decision").with(csrf()).session(moderator.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("decision", "APPROVE"))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/notifications").session(fatou.session()))
                .andExpect(jsonPath("$.items[0].type").value("JOB_REVIEWED"))
                .andExpect(jsonPath("$.items[0].outcome").value("PUBLISHED"))
                .andExpect(jsonPath("$.items[0].actor").doesNotExist());
        mvc.perform(get("/api/v1/notifications").session(aminata.session()))
                .andExpect(jsonPath("$.items[0].type").value("JOB_MATCH"))
                .andExpect(jsonPath("$.items[0].target.type").value("JOB"))
                .andExpect(jsonPath("$.items[0].target.id").value(jobId));
        assertCount(kofi, 0);

        long applicationId = read(mvc.perform(multipart("/api/v1/jobs/" + jobId + "/applications")
                        .param("message", MESSAGE).with(csrf()).session(aminata.session()))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(get("/api/v1/notifications").session(fatou.session()))
                .andExpect(jsonPath("$.items[0].type").value("APPLICATION_RECEIVED"))
                .andExpect(jsonPath("$.items[0].actor.username").value(aminata.username()));

        mvc.perform(patch("/api/v1/applications/" + applicationId).with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("status", "REJECTED"))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/notifications").session(aminata.session()))
                .andExpect(jsonPath("$.items[0].type").value("APPLICATION_DECIDED"))
                .andExpect(jsonPath("$.items[0].outcome").value("REJECTED"))
                .andExpect(jsonPath("$.items[0].target.type").value("APPLICATION"))
                .andExpect(jsonPath("$.items[0].target.id").value(applicationId));

        // Une mission qui correspond à la stack d'Aminata la prévient, pas son auteur.
        mvc.perform(post("/api/v1/missions").with(csrf()).session(kofi.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("title", "Revue de code d'une intégration Orange Money", "kind", "CODE_REVIEW",
                                "description", "Relire mon intégration Orange Money avant la mise en production.",
                                "budget", Map.of("amount", 30000, "currency", "XOF"), "durationDays", 2,
                                "technologies", List.of(tech)))))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/notifications").session(aminata.session()))
                .andExpect(jsonPath("$.items[0].type").value("MISSION_MATCH"))
                .andExpect(jsonPath("$.items[0].actor.username").value(kofi.username()));
        assertCount(kofi, 0);
    }

    @Test
    void leCompteurDemandeUneSession() throws Exception {
        mvc.perform(get("/api/v1/notifications/unread-count")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/notifications/read").with(csrf())).andExpect(status().isUnauthorized());
    }

    private void assertCount(Member member, long expected) throws Exception {
        org.assertj.core.api.Assertions.assertThat(count(member.session())).isEqualTo(expected);
    }
}
