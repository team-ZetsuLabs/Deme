package dev.zetsu.reputation;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.ResultActions;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Badges (REP-4), avec les seuils abaissés du profil de démo pour garder des scénarios courts. */
@TestPropertySource(properties = {"zetsu.badges.helper-answers=3", "zetsu.badges.solver-accepted=2",
        "zetsu.badges.polyglot-tags=2", "zetsu.badges.local-help-answers=2"})
class BadgeIntegrationTest extends IntegrationTest {

    private static final String ANSWER = "Vérifiez la signature HMAC du callback avant de valider la commande, "
            + "puis enregistrez l'identifiant de transaction avec un index unique pour ignorer les doublons.";

    private long answer(Member author, long questionId) throws Exception {
        return read(mvc.perform(post("/api/v1/questions/{id}/answers", questionId).with(csrf())
                        .session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("body", ANSWER))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private void accept(Member questionAuthor, long questionId, long answerId) throws Exception {
        mvc.perform(put("/api/v1/questions/{id}/accepted-answer", questionId).with(csrf())
                        .session(questionAuthor.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("answerId", answerId))))
                .andExpect(status().isOk());
    }

    private long question(Member author, String country, String tag) throws Exception {
        return askQuestion(author, "Callback de paiement reçu deux fois en production",
                "Mon serveur reçoit parfois deux fois le même callback de paiement quand le réseau est instable.",
                country, List.of(tag));
    }

    private ResultActions badges(Member member) throws Exception {
        return mvc.perform(get("/api/v1/users/{username}/badges", member.username()));
    }

    @Test
    void unNouveauMembreVoitLesSixBadgesSansEnAvoirGagne() throws Exception {
        Member awa = register("Awa");
        badges(awa)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].badge").value("FIRST_STEP"))
                .andExpect(jsonPath("$[0].earned").value(false))
                .andExpect(jsonPath("$[0].progress").value(0))
                .andExpect(jsonPath("$[0].target").value(1))
                .andExpect(jsonPath("$[1].badge").value("HELPER"))
                .andExpect(jsonPath("$[1].target").value(3));
        mvc.perform(get("/api/v1/users/{username}", awa.username()))
                .andExpect(jsonPath("$.badges.length()").value(0));
    }

    @Test
    void premierPasEntraideAideLocaleEtResolveur() throws Exception {
        Member kofi = register("Kofi", "GH");
        Member ama = register("Ama", "GH");
        Member chidi = register("Chidi", "NG");
        long q1 = question(ama, "GH", "laravel");
        long q2 = question(ama, "GH", "flutter");
        long q3 = question(chidi, "NG", "django");

        long a1 = answer(kofi, q1);
        // Premier pas dès la première réponse ; une réponse ne rapporte pas de points, le badge vient quand même.
        mvc.perform(get("/api/v1/users/{username}", kofi.username()))
                .andExpect(jsonPath("$.badges[0]").value("FIRST_STEP"));

        long a2 = answer(kofi, q2);
        answer(kofi, q3);
        mvc.perform(get("/api/v1/users/{username}", kofi.username()))
                .andExpect(jsonPath("$.badges").value(containsInAnyOrder(
                        "FIRST_STEP", "HELPER", "LOCAL_HELP")));

        accept(ama, q1, a1);
        accept(ama, q2, a2);
        badges(kofi)
                .andExpect(jsonPath("$[?(@.badge == 'SOLVER')].earned").value(true))
                .andExpect(jsonPath("$[?(@.badge == 'SOLVER')].progress").value(2))
                // Deux réponses acceptées dans deux étiquettes différentes (laravel, flutter).
                .andExpect(jsonPath("$[?(@.badge == 'POLYGLOT')].earned").value(true))
                // Deux réponses à des questions du Ghana sur trois.
                .andExpect(jsonPath("$[?(@.badge == 'LOCAL_HELP')].progress").value(2))
                .andExpect(jsonPath("$[?(@.badge == 'CHALLENGER')].earned").value(false))
                .andExpect(jsonPath("$[?(@.badge == 'FIRST_STEP')].awardedAt").exists());
    }

    @Test
    void sesPropresQuestionsNeComptentPasPourLAideLocale() throws Exception {
        Member fatou = register("Fatou", "SN");
        answer(fatou, question(fatou, "SN", "react"));
        answer(fatou, question(fatou, "SN", "vue"));
        badges(fatou)
                .andExpect(jsonPath("$[?(@.badge == 'LOCAL_HELP')].progress").value(0))
                .andExpect(jsonPath("$[?(@.badge == 'LOCAL_HELP')].earned").value(false));
    }

    @Test
    void unBadgeGagneNeSePerdPas() throws Exception {
        Member yao = register("Yao", "CI");
        long answerId = answer(yao, question(register("Adjoa", "CI"), "CI", "spring-boot"));
        jdbc.update("update answers set hidden = true where id = ?", answerId);
        badges(yao)
                .andExpect(jsonPath("$[?(@.badge == 'FIRST_STEP')].earned").value(true))
                .andExpect(jsonPath("$[?(@.badge == 'FIRST_STEP')].progress").value(0));
    }

    @Test
    void challengerQuandUnDepotEstValide() throws Exception {
        Member moussa = register("Moussa", "ML");
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        Long challengeId = jdbc.queryForObject("""
                insert into challenges (title, statement_markdown, statement_html, specifications_markdown,
                                        specifications_html, starts_at, ends_at)
                values ('Un menu USSD de paiement', 'Énoncé', '<p>Énoncé</p>', 'Cahier', '<p>Cahier</p>',
                        '2020-01-06T08:00:00Z', '2020-01-13T08:00:00Z')
                returning id""", Long.class);
        Long submissionId = jdbc.queryForObject("""
                insert into submissions (challenge_id, member_id, repository_url) values (?, ?, ?) returning id""",
                Long.class, challengeId, moussa.id(), "https://github.com/moussa/ussd-facture");

        mvc.perform(post("/api/v1/admin/submissions/" + submissionId + "/review").with(csrf())
                        .session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("status", "VALIDATED", "score", 82))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/users/{username}", moussa.username()))
                .andExpect(jsonPath("$.badges[0]").value("CHALLENGER"));
    }

    @Test
    void membreInconnu() throws Exception {
        mvc.perform(get("/api/v1/users/{username}/badges", "personne_ici"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
    }
}
