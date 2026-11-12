package dev.zetsu.question;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class QuestionIntegrationTest extends IntegrationTest {

    private static final String BODY = "J'intègre l'API de paiement Orange Money dans une application Spring Boot "
            + "et je ne sais pas comment vérifier la notification de paiement côté serveur.";

    @Test
    void poserPuisLireUneQuestion() throws Exception {
        Member fatou = register("Fatou");
        long id = askQuestion(fatou, "Vérifier un paiement Orange Money côté serveur", BODY, "SN");

        mvc.perform(get("/api/v1/questions/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Vérifier un paiement Orange Money côté serveur"))
                .andExpect(jsonPath("$.tags").value(hasItem("mobile-money")))
                .andExpect(jsonPath("$.context.countryCode").value("SN"))
                .andExpect(jsonPath("$.context.mobileMoneyOperator").value("ORANGE_MONEY"))
                .andExpect(jsonPath("$.context.networkQuality").value("UNSTABLE"))
                .andExpect(jsonPath("$.context.techVersion").value("Spring Boot 3.3"))
                .andExpect(jsonPath("$.author.level").value("NEWCOMER"))
                .andExpect(jsonPath("$.author.username").value(fatou.username()))
                .andExpect(jsonPath("$.myVote").doesNotExist())
                .andExpect(jsonPath("$.canEdit").value(false));
    }

    @Test
    void contenuPiegeEstNettoye() throws Exception {
        Member fatou = register("Fatou");
        String piege = "Voici mon code <script>alert(1)</script> et <img src=x onerror=alert(1)> "
                + "et [un lien](javascript:alert(1)) et [la doc](https://developer.orange.com) pour comprendre.";
        long id = askQuestion(fatou, "Question avec un contenu piégé dedans", piege, "CI");

        mvc.perform(get("/api/v1/questions/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bodyHtml").value(not(containsString("<script"))))
                .andExpect(jsonPath("$.bodyHtml").value(not(containsString("<img"))))
                .andExpect(jsonPath("$.bodyHtml").value(not(containsString("javascript:"))))
                .andExpect(jsonPath("$.bodyHtml").value(containsString("href=\"https://developer.orange.com\"")))
                .andExpect(jsonPath("$.bodyHtml").value(containsString("rel=\"nofollow noopener noreferrer\"")));
    }

    @Test
    void questionIntrouvable() throws Exception {
        mvc.perform(get("/api/v1/questions/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
    }

    @Test
    void titreTropCourtRenvoieLeChamp() throws Exception {
        Member fatou = register("Fatou");
        mvc.perform(post("/api/v1/questions").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("title", "Aide", "body", BODY, "tags", List.of("java")))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.title").exists());
    }

    @Test
    void rechercheEnFrancaisEtFiltreParPays() throws Exception {
        Member ama = register("Ama");
        askQuestion(ama, "Paiements MTN MoMo refusés en production à Accra",
                "Depuis hier, les paiements MTN MoMo sont refusés avec une erreur 500 alors que tout marche en sandbox.",
                "GH");
        askQuestion(ama, "Optimiser une page React pour la 3G au Burkina",
                "Ma page React met douze secondes à charger en 3G à Ouagadougou, comment réduire le poids du bundle ?",
                "BF");

        // « paiement » au singulier retrouve « Paiements » grâce au dictionnaire français.
        mvc.perform(get("/api/v1/questions").param("q", "paiement momo").param("country", "GH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].title").value("Paiements MTN MoMo refusés en production à Accra"))
                .andExpect(jsonPath("$.items[0].excerpt").value(containsString("sandbox")))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20));

        mvc.perform(get("/api/v1/questions").param("q", "bundle").param("country", "GH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));

        mvc.perform(get("/api/v1/questions").param("country", "XX"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_COUNTRY"));

        mvc.perform(get("/api/v1/questions").param("size", "500"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PAGE_SIZE"));
    }

    @Test
    void seulLAuteurPeutModifier() throws Exception {
        Member fatou = register("Fatou");
        Member moussa = register("Moussa");
        long id = askQuestion(fatou, "Vérifier un paiement Orange Money côté serveur", BODY, "SN");
        String update = body(Map.of("title", "Vérifier une notification Orange Money", "body", BODY,
                "tags", List.of("orange-money")));

        mvc.perform(put("/api/v1/questions/{id}", id).with(csrf()).session(moussa.session())
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_QUESTION_AUTHOR"));

        mvc.perform(put("/api/v1/questions/{id}", id).with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Vérifier une notification Orange Money"))
                .andExpect(jsonPath("$.tags[0]").value("orange-money"))
                .andExpect(jsonPath("$.canEdit").value(true));
    }

    @Test
    void publierSansEtreConnecteRenvoie401() throws Exception {
        mvc.perform(post("/api/v1/questions").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void codeStockeEnTexteBrutEtCinqEtiquettesRefusees() throws Exception {
        Member fatou = register("Fatou");
        String code = "if (amount < 100) { System.out.println(\"<b>montant</b>\"); }";
        var created = mvc.perform(post("/api/v1/questions").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("title", "Montant minimum refusé par l'API Wave", "body", BODY,
                                "code", code, "tags", List.of("wave")))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(code))
                .andReturn();
        long id = read(created).get("id").asLong();
        mvc.perform(get("/api/v1/questions/{id}", id)).andExpect(jsonPath("$.code").value(code));

        mvc.perform(post("/api/v1/questions").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("title", "Montant minimum refusé par l'API Wave", "body", BODY,
                                "tags", List.of("a", "b", "c", "d", "e")))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.tags").value("Entre 1 et 4 étiquettes"));
    }

    @Test
    void rechercheSurLesEtiquettesEtFiltreSansSolution() throws Exception {
        Member ama = register("Ama");
        long id = askQuestion(ama, "Intégration USSD qui coupe au bout de 20 secondes",
                "Ma session USSD se ferme toujours avant la fin du menu, sur tous les opérateurs testés au Togo.",
                "TG", List.of("africastalking"));

        // Le mot n'apparaît que dans l'étiquette.
        mvc.perform(get("/api/v1/questions").param("q", "africastalking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(id));

        mvc.perform(get("/api/v1/questions").param("country", "TG").param("status", "UNSOLVED"))
                .andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/questions").param("country", "TG").param("status", "SOLVED"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/questions").param("country", "TG").param("network", "UNSTABLE")
                        .param("sort", "VOTES"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void lAuteurSupprimeSaQuestionSansReponse() throws Exception {
        Member fatou = register("Fatou");
        Member moussa = withReputation(register("Moussa"), 50);
        long id = askQuestion(fatou, "Webhook Wave reçu deux fois en production", BODY, "SN");
        mvc.perform(post("/api/v1/questions/{id}/votes", id).with(csrf()).session(moussa.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("value", 1))))
                .andExpect(status().isOk());
        int before = jdbc.queryForObject("select reputation from users where id = ?", Integer.class, fatou.id());
        mvc.perform(get("/api/v1/questions/{id}", id).session(fatou.session()))
                .andExpect(jsonPath("$.canDelete").value(true));
        mvc.perform(get("/api/v1/questions/{id}", id).session(moussa.session()))
                .andExpect(jsonPath("$.canDelete").value(false));

        mvc.perform(delete("/api/v1/questions/{id}", id).with(csrf()))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/v1/questions/{id}", id).with(csrf()).session(moussa.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_QUESTION_AUTHOR"));
        mvc.perform(delete("/api/v1/questions/{id}", id).with(csrf()).session(fatou.session()))
                .andExpect(status().isNoContent());

        // Elle n'existe plus pour personne, ni en lecture, ni pour y répondre ou la modifier.
        mvc.perform(get("/api/v1/questions/{id}", id).session(fatou.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
        mvc.perform(get("/api/v1/questions").param("size", "50"))
                .andExpect(jsonPath("$.items[?(@.id == " + id + ")]", hasSize(0)));
        mvc.perform(post("/api/v1/questions/{id}/answers", id).with(csrf()).session(moussa.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("body", BODY))))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/questions/{id}", id).with(csrf()).session(fatou.session()))
                .andExpect(status().isNotFound());

        // Les points de la question posée (+5) et du vote reçu (+2) sont retirés, le vote avec.
        int after = jdbc.queryForObject("select reputation from users where id = ?", Integer.class, fatou.id());
        assertThat(before - after).isEqualTo(7);
        assertThat(jdbc.queryForObject("select count(*) from votes where target_type = 'QUESTION' and target_id = ?",
                Integer.class, id)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from notifications where target_type = 'QUESTION' "
                + "and target_id = ?", Integer.class, id)).isZero();
    }

    @Test
    void uneQuestionAvecReponseNeSeSupprimePlus() throws Exception {
        Member fatou = register("Fatou");
        long id = askQuestion(fatou, "Limiter les appels USSD sur un réseau instable", BODY, "BF");
        mvc.perform(post("/api/v1/questions/{id}/answers", id).with(csrf()).session(register("Issa", "BF").session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("body", BODY))))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/questions/{id}", id).session(fatou.session()))
                .andExpect(jsonPath("$.canDelete").value(false));
        mvc.perform(delete("/api/v1/questions/{id}", id).with(csrf()).session(fatou.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("QUESTION_HAS_ANSWERS"));
        mvc.perform(get("/api/v1/questions/{id}", id)).andExpect(status().isOk());
    }
}
