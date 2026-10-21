package dev.zetsu.vote;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnswerVoteIntegrationTest extends IntegrationTest {

    private static final String QUESTION_BODY = "Mon webhook Wave reçoit deux fois la même notification, "
            + "comment éviter de créditer deux fois le client ?";
    private static final String ANSWER_BODY = "Stocke l'identifiant de transaction avec une contrainte d'unicité "
            + "et ignore la seconde notification.";

    @Test
    void voteUniqueEtReputation() throws Exception {
        Member aicha = register("Aicha");
        Member yao = register("Yao");
        Member chidi = register("Chidi");
        long questionId = askQuestion(aicha, "Webhook Wave reçu deux fois au Sénégal", QUESTION_BODY, "SN");
        long answerId = answer(yao, questionId);

        mvc.perform(vote("/api/v1/answers/{id}/votes", answerId, 1, chidi))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(1))
                .andExpect(jsonPath("$.myVote").value(1));
        reputationOf(yao, 10);

        mvc.perform(vote("/api/v1/answers/{id}/votes", answerId, 1, chidi))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_VOTED"));

        mvc.perform(vote("/api/v1/answers/{id}/votes", answerId, -1, chidi))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(-1));
        reputationOf(yao, -2);

        mvc.perform(delete("/api/v1/answers/{id}/votes", answerId).with(csrf()).session(chidi.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(0))
                .andExpect(jsonPath("$.myVote").doesNotExist());
        reputationOf(yao, 0);

        mvc.perform(get("/api/v1/users/{u}/reputation", yao.username()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4));
    }

    @Test
    void onNeVotePasPourSoi() throws Exception {
        Member aicha = register("Aicha");
        long questionId = askQuestion(aicha, "Webhook Wave reçu deux fois au Sénégal", QUESTION_BODY, "SN");

        mvc.perform(vote("/api/v1/questions/{id}/votes", questionId, 1, aicha))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_VOTE_OWN_CONTENT"));

        mvc.perform(vote("/api/v1/questions/{id}/votes", questionId, 2, register("Yao")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_VOTE"));
    }

    @Test
    void accepterUneReponse() throws Exception {
        Member aicha = register("Aicha");
        Member yao = register("Yao");
        Member chidi = register("Chidi");
        long questionId = askQuestion(aicha, "Webhook Wave reçu deux fois au Sénégal", QUESTION_BODY, "SN");
        long first = answer(yao, questionId);
        long second = answer(chidi, questionId);

        mvc.perform(put("/api/v1/questions/{id}/accepted-answer", questionId).with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("answerId", second))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_QUESTION_AUTHOR"));

        mvc.perform(put("/api/v1/questions/{id}/accepted-answer", questionId).with(csrf()).session(aicha.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("answerId", second))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acceptedAnswerId").value(second));
        reputationOf(chidi, 15);
        reputationOf(aicha, 2);

        mvc.perform(get("/api/v1/questions/{id}/answers", questionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].id").value(second))
                .andExpect(jsonPath("$.items[0].accepted").value(true))
                .andExpect(jsonPath("$.items[1].id").value(first));

        // Changer d'avis déplace les points, sans doubler le bonus de l'auteur de la question.
        mvc.perform(put("/api/v1/questions/{id}/accepted-answer", questionId).with(csrf()).session(aicha.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("answerId", first))))
                .andExpect(status().isOk());
        reputationOf(chidi, 0);
        reputationOf(yao, 15);
        reputationOf(aicha, 2);

        mvc.perform(delete("/api/v1/questions/{id}/accepted-answer", questionId).with(csrf()).session(aicha.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acceptedAnswerId").doesNotExist());
        reputationOf(yao, 0);
        reputationOf(aicha, 0);

        mvc.perform(get("/api/v1/questions/{id}", questionId))
                .andExpect(jsonPath("$.answerCount").value(2));
    }

    private long answer(Member author, long questionId) throws Exception {
        var result = mvc.perform(post("/api/v1/questions/{id}/answers", questionId).with(csrf())
                        .session(author.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("body", ANSWER_BODY))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accepted").value(false))
                .andReturn();
        return read(result).get("id").asLong();
    }

    private org.springframework.test.web.servlet.RequestBuilder vote(String path, long id, int value, Member voter)
            throws Exception {
        return post(path, id).with(csrf()).session(voter.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("value", value)));
    }

    private void reputationOf(Member member, int expected) throws Exception {
        mvc.perform(get("/api/v1/users/{u}", member.username()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reputation").value(expected));
    }
}
