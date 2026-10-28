package dev.zetsu.user;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Champs du profil public (REP-5) et du membre connecté. */
class ProfileIntegrationTest extends IntegrationTest {

    private static final String ANSWER = "Passez par l'API de collecte d'Orange Money avec une clé d'idempotence, "
            + "puis confirmez le statut par un appel serveur plutôt que de vous fier au seul retour du téléphone.";

    private long answer(Member author, long questionId) throws Exception {
        return read(mvc.perform(post("/api/v1/questions/{id}/answers", questionId).with(csrf())
                        .session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("body", ANSWER))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    @Test
    void leProfilDonneLIdentifiantLesReponsesAccepteesEtLeNiveauSuivant() throws Exception {
        Member fatou = register("Fatou", "SN");
        Member yao = register("Yao", "CI");

        mvc.perform(get("/api/v1/users/{username}", yao.username()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(yao.id()))
                .andExpect(jsonPath("$.acceptedCount").value(0))
                .andExpect(jsonPath("$.level").value("NEWCOMER"))
                .andExpect(jsonPath("$.nextLevelAt").value(50));

        long first = askQuestion(fatou, "Paiement Orange Money validé deux fois après une coupure réseau",
                "Le client paie, la connexion coupe, il relance et le paiement passe deux fois.", "SN");
        long second = askQuestion(fatou, "Délai d'expiration conseillé pour une demande de paiement mobile",
                "Combien de temps garder une demande de paiement ouverte avant de l'annuler ?", "SN");
        long accepted = answer(yao, first);
        answer(yao, second);
        mvc.perform(put("/api/v1/questions/{id}/accepted-answer", first).with(csrf())
                        .session(fatou.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("answerId", accepted))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/users/{username}", yao.username()))
                .andExpect(jsonPath("$.answerCount").value(2))
                .andExpect(jsonPath("$.acceptedCount").value(1));
    }

    @Test
    void leNiveauSuivantSuitLesSeuilsDeLaSection8() throws Exception {
        Member kofi = withReputation(register("Kofi", "GH"), 600);
        mvc.perform(get("/api/v1/users/{username}", kofi.username()))
                .andExpect(jsonPath("$.level").value("CONTRIBUTOR"))
                .andExpect(jsonPath("$.nextLevelAt").value(1500));

        withReputation(kofi, 1500);
        mvc.perform(get("/api/v1/users/{username}", kofi.username()))
                .andExpect(jsonPath("$.level").value("REFERENT"))
                .andExpect(jsonPath("$.nextLevelAt").doesNotExist());
    }

    @Test
    void unEmailSaisiALInscriptionNEstPasEncoreVerifie() throws Exception {
        Member awa = register("Awa", "CI");
        mvc.perform(get("/api/v1/auth/me").session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(false));
    }
}
