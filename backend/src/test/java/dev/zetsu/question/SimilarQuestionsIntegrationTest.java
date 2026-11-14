package dev.zetsu.question;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Questions similaires pendant la saisie du titre (QA-8). La base est partagée entre les tests : chaque test
 * utilise un mot rare (« kossodo », « treichville ») et vérifie la place de ses propres questions.
 */
class SimilarQuestionsIntegrationTest extends IntegrationTest {

    @Test
    void trouveLesQuestionsQuiPartagentAuMoinsDeuxMots() throws Exception {
        Member awa = register("Awa", "BF");
        long proche = askQuestion(awa, "Paiement Orange Money bloqué à Kossodo avec Laravel",
                "Le webhook de paiement Orange Money n'arrive jamais sur mon serveur Laravel hébergé à Ouagadougou.",
                "BF", List.of("laravel", "orange-money"));
        long partielle = askQuestion(awa, "Webhook Laravel perdu à Kossodo",
                "Les webhooks reçus par mon application Laravel disparaissent quand le serveur redémarre.",
                "BF", List.of("laravel"));
        long unSeulMot = askQuestion(awa, "Erreur de compilation Gradle à Kossodo",
                "La compilation Gradle échoue sur mon poste depuis la mise à jour d'Android Studio.",
                "BF", List.of("android"));

        // Pluriel, ordre différent, titre incomplet : les radicaux suffisent. La question partielle partage
        // 3 mots (webhook, kossodo, laravel), plus que les questions « Orange Money » des autres tests (2).
        mvc.perform(get("/api/v1/questions/similar").param("title", "webhooks orange money kossodo laravel")
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(proche))
                .andExpect(jsonPath("$[0].title").value("Paiement Orange Money bloqué à Kossodo avec Laravel"))
                .andExpect(jsonPath("$[0].answerCount").value(0))
                .andExpect(jsonPath("$[0].hasAcceptedAnswer").value(false))
                .andExpect(jsonPath("$[*].id", hasItem((int) partielle)))
                .andExpect(jsonPath("$[*].id", not(hasItem((int) unSeulMot))));
    }

    @Test
    void unTitreDUnSeulMotUtileSuffit() throws Exception {
        Member yao = register("Yao", "CI");
        long q = askQuestion(yao, "Installer Flutterwave sur un serveur à Yamoussoukro",
                "Je cherche à installer le SDK Flutterwave sur un serveur Node.js à Yamoussoukro.",
                "CI", List.of("nodejs"));
        // « comment » et « je » sont écartés : il ne reste que « yamoussoukro ».
        mvc.perform(get("/api/v1/questions/similar").param("title", "comment je yamoussoukro"))
                .andExpect(jsonPath("$[*].id", hasItem((int) q)));
    }

    @Test
    void ecarteLesQuestionsMasqueesEtLaQuestionModifiee() throws Exception {
        Member kofi = register("Kofi", "CI");
        long visible = askQuestion(kofi, "Coupures réseau à Treichville pendant un paiement Wave",
                "Le paiement Wave échoue quand le réseau coupe à Treichville, comment reprendre la transaction ?",
                "CI", List.of("wave"));
        long masquee = askQuestion(kofi, "Paiement Wave interrompu à Treichville",
                "Même souci de paiement Wave interrompu à Treichville, la transaction reste en attente.",
                "CI", List.of("wave"));
        jdbc.update("update questions set hidden = true where id = ?", masquee);

        mvc.perform(get("/api/v1/questions/similar").param("title", "paiement wave treichville"))
                .andExpect(jsonPath("$[*].id", hasItem((int) visible)))
                .andExpect(jsonPath("$[*].id", not(hasItem((int) masquee))));
        mvc.perform(get("/api/v1/questions/similar").param("title", "paiement wave treichville")
                        .param("exclude", String.valueOf(visible)))
                .andExpect(jsonPath("$[*].id", not(hasItem((int) visible))));
    }

    @Test
    void titreTropCourtOuSansMotUtile() throws Exception {
        mvc.perform(get("/api/v1/questions/similar").param("title", "wave"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        // Uniquement des mots vides, en français ou en anglais : aucune question.
        mvc.perform(get("/api/v1/questions/similar").param("title", "est-ce que je le la the"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
        // Les caractères spéciaux de tsquery ne provoquent pas d'erreur.
        mvc.perform(get("/api/v1/questions/similar").param("title", "a & b | !c ' :* (kossodo) <->"))
                .andExpect(status().isOk());
    }

    @Test
    void limiteBornee() throws Exception {
        mvc.perform(get("/api/v1/questions/similar").param("title", "paiement orange money").param("limit", "50"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_LIMIT"));
        mvc.perform(get("/api/v1/questions/similar"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PARAMETER"));
    }

    @Test
    void contratPublie() throws Exception {
        mvc.perform(get("/api/v1/openapi.json"))
                .andExpect(jsonPath("$.paths['/api/v1/questions/similar'].get").exists())
                .andExpect(jsonPath("$.components.schemas.SimilarQuestion").exists());
    }
}
