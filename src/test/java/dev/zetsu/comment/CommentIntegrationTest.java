package dev.zetsu.comment;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.RequestBuilder;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommentIntegrationTest extends IntegrationTest {

    private static final String QUESTION_BODY = "Mon webhook Wave reçoit deux fois la même notification de paiement "
            + "et je crédite le client deux fois. Comment éviter ce doublon côté serveur ?";
    private static final String ANSWER_BODY = "Garde l'identifiant de transaction Wave avec une contrainte d'unicité "
            + "et ignore toute notification déjà enregistrée.";

    @Test
    void commenterUneQuestionEtUneReponse() throws Exception {
        Member awa = register("Awa");
        Member koffi = register("Koffi", "CI");
        long questionId = askQuestion(awa, "Notification Wave reçue deux fois sur mon webhook", QUESTION_BODY, "SN");
        long answerId = answer(koffi, questionId);

        mvc.perform(comment("/api/v1/questions/{id}/comments", questionId, koffi, "Tu utilises quelle version de l'API ?"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.author.username").value(koffi.username()))
                .andExpect(jsonPath("$.bodyHtml").value(containsString("quelle version")))
                .andExpect(jsonPath("$.canDelete").value(true));
        mvc.perform(comment("/api/v1/answers/{id}/comments", answerId, awa, "Merci, ça marche avec l'index unique."))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/questions/{id}", questionId).session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].author.username").value(koffi.username()))
                .andExpect(jsonPath("$.comments[0].canDelete").value(false));
        mvc.perform(get("/api/v1/questions/{id}/answers", questionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].comments", hasSize(1)))
                .andExpect(jsonPath("$.items[0].comments[0].author.username").value(awa.username()))
                .andExpect(jsonPath("$.items[0].comments[0].canDelete").value(false));
        mvc.perform(get("/api/v1/questions/{id}/comments", questionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/v1/answers/{id}/comments", answerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void contenuPiegeEstNettoye() throws Exception {
        Member awa = register("Awa");
        long questionId = askQuestion(awa, "Notification Wave reçue deux fois sur mon webhook", QUESTION_BODY, "SN");

        mvc.perform(comment("/api/v1/questions/{id}/comments", questionId, awa,
                        "<script>alert(1)</script> <img src=x onerror=alert(1)>\n\nVoir [ce lien](javascript:alert(1))"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bodyHtml").value(not(containsString("<script"))))
                .andExpect(jsonPath("$.bodyHtml").value(not(containsString("<img"))))
                .andExpect(jsonPath("$.bodyHtml").value(not(containsString("href=\"javascript"))))
                .andExpect(jsonPath("$.bodyHtml").value(containsString("&lt;script&gt;")));
    }

    @Test
    void validationConnexionEtCibleIntrouvable() throws Exception {
        Member awa = register("Awa");
        long questionId = askQuestion(awa, "Notification Wave reçue deux fois sur mon webhook", QUESTION_BODY, "SN");

        mvc.perform(comment("/api/v1/questions/{id}/comments", questionId, awa, " "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.body").exists());
        mvc.perform(comment("/api/v1/questions/{id}/comments", questionId, awa, "x".repeat(1001)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.body").value("Entre 2 et 1000 caractères"));
        mvc.perform(post("/api/v1/questions/{id}/comments", questionId).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("body", "Bonne question"))))
                .andExpect(status().isUnauthorized());
        mvc.perform(comment("/api/v1/questions/{id}/comments", 999999L, awa, "Bonne question"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
        mvc.perform(comment("/api/v1/answers/{id}/comments", 999999L, awa, "Bonne réponse"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ANSWER_NOT_FOUND"));
    }

    @Test
    void questionMasqueeNeSeCommentePas() throws Exception {
        Member awa = register("Awa");
        Member koffi = register("Koffi", "CI");
        long questionId = askQuestion(awa, "Notification Wave reçue deux fois sur mon webhook", QUESTION_BODY, "SN");
        jdbc.update("update questions set hidden = true where id = ?", questionId);

        mvc.perform(comment("/api/v1/questions/{id}/comments", questionId, koffi, "Bonne question"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("QUESTION_NOT_FOUND"));
    }

    @Test
    void seulAuteurOuEquipeSupprime() throws Exception {
        Member awa = register("Awa");
        Member koffi = register("Koffi", "CI");
        Member modo = withRole(register("Mariam", "ML"), "MODERATOR");
        long questionId = askQuestion(awa, "Notification Wave reçue deux fois sur mon webhook", QUESTION_BODY, "SN");
        long first = commentId(questionId, koffi, "Tu utilises quelle version de l'API ?");
        long second = commentId(questionId, koffi, "Et tu es en sandbox ou en production ?");

        mvc.perform(delete("/api/v1/comments/{id}", first).with(csrf()).session(awa.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_COMMENT_AUTHOR"));
        mvc.perform(delete("/api/v1/comments/{id}", first).with(csrf()).session(koffi.session()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/questions/{id}", questionId).session(modo.session()))
                .andExpect(jsonPath("$.comments", hasSize(1)))
                .andExpect(jsonPath("$.comments[0].canDelete").value(true));
        mvc.perform(delete("/api/v1/comments/{id}", second).with(csrf()).session(modo.session()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/comments/{id}", second).with(csrf()).session(modo.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COMMENT_NOT_FOUND"));
        mvc.perform(get("/api/v1/questions/{id}", questionId))
                .andExpect(jsonPath("$.comments", hasSize(0)));
    }

    private long commentId(long questionId, Member author, String text) throws Exception {
        return read(mvc.perform(comment("/api/v1/questions/{id}/comments", questionId, author, text))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private long answer(Member author, long questionId) throws Exception {
        var result = mvc.perform(post("/api/v1/questions/{id}/answers", questionId).with(csrf())
                        .session(author.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("body", ANSWER_BODY))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comments", hasSize(0)))
                .andReturn();
        return read(result).get("id").asLong();
    }

    private RequestBuilder comment(String path, long id, Member author, String text) throws Exception {
        return post(path, id).with(csrf()).session(author.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("body", text)));
    }
}
