package dev.zetsu.challenge;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * CH-1 à CH-3. L'horloge du service est avancée à la main ; chaque test prend sa propre semaine, loin dans le
 * futur, car deux défis ne peuvent pas se chevaucher et la base est partagée entre les tests.
 */
class ChallengeIntegrationTest extends IntegrationTest {

    private static final AtomicInteger WEEK = new AtomicInteger();
    private static final String STATEMENT = "Beaucoup de clients paient encore leur facture d'eau par USSD, sans smartphone. "
            + "Construisez un menu USSD qui permet de payer une facture en moins de 5 écrans.";
    private static final String SPECS = "- Saisie du numéro de compteur\n- Paiement simulé par mobile money\n"
            + "- Session USSD coupée : reprise sans repayer";

    @Autowired
    private ChallengeService challengeService;

    @AfterEach
    void resetClock() {
        challengeService.setClock(Clock.systemUTC());
    }

    private Instant newWeek() {
        // Deux semaines d'écart : un défi d'une semaine ne touche jamais celui du test suivant.
        return Instant.parse("2031-01-06T08:00:00Z").plus(Duration.ofDays(14L * WEEK.incrementAndGet()));
    }

    private void at(Instant now) {
        challengeService.setClock(Clock.fixed(now, ZoneOffset.UTC));
    }

    private Map<String, Object> challenge(String title, Instant start, Instant end) {
        return Map.of("title", title, "statement", STATEMENT, "specifications", SPECS,
                "technologies", List.of("ussd", "node.js"), "startsAt", start.toString(), "endsAt", end.toString());
    }

    private long create(Member staff, Map<String, Object> req) throws Exception {
        return read(mvc.perform(post("/api/v1/admin/challenges").with(csrf()).session(staff.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(req)))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private ResultActions submit(Member member, long challengeId, String url) throws Exception {
        return mvc.perform(post("/api/v1/challenges/" + challengeId + "/submissions").with(csrf())
                .session(member.session()).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("repositoryUrl", url))));
    }

    private long submissionId(Member member, long challengeId, String url) throws Exception {
        return read(submit(member, challengeId, url).andExpect(status().isCreated()).andReturn()).get("id").asLong();
    }

    private ResultActions review(Member staff, long submissionId, String status, int score) throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("status", status, "score", score));
        req.put("feedback", "Parcours clair, il manque des tests sur les montants.");
        return mvc.perform(post("/api/v1/admin/submissions/" + submissionId + "/review").with(csrf())
                .session(staff.session()).contentType(MediaType.APPLICATION_JSON).content(body(req)));
    }

    private int reputationOf(Member member) throws Exception {
        return read(mvc.perform(get("/api/v1/auth/me").session(member.session())).andReturn()).get("reputation").asInt();
    }

    @Test
    void unDefiDuDebutALaFin() throws Exception {
        Instant start = newWeek();
        Instant end = start.plus(Duration.ofDays(7));
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        Member awa = register("Awa", "CI");

        at(start.minus(Duration.ofDays(1)));
        long id = create(rimvie, challenge("Un menu USSD de paiement de facture", start, end));
        mvc.perform(get("/api/v1/challenges/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/admin/challenges").param("status", "UPCOMING").param("size", "50")
                        .session(rimvie.session()))
                .andExpect(jsonPath("$.items[?(@.id == " + id + ")].status").value("UPCOMING"));

        // Au début, chaque membre est prévenu une seule fois.
        at(start.plus(Duration.ofHours(1)));
        challengeService.notifyStartedChallenges();
        challengeService.notifyStartedChallenges();
        mvc.perform(get("/api/v1/notifications").session(awa.session()))
                .andExpect(jsonPath("$.items[?(@.type == 'CHALLENGE_STARTED' && @.target.id == " + id + ")]",
                        hasSize(1)));

        mvc.perform(get("/api/v1/challenges/current"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.technologies[0]").value("ussd"))
                .andExpect(jsonPath("$.statementHtml").value(startsWith("<p>")))
                .andExpect(jsonPath("$.endsAt").value(end.toString()))
                .andExpect(jsonPath("$.serverTime").value(start.plus(Duration.ofHours(1)).toString()))
                .andExpect(jsonPath("$.mySubmission").doesNotExist());

        submit(awa, id, "https://gitlab.com/awa/ussd")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.repositoryUrl").exists());
        submit(awa, id, "javascript:alert(1)").andExpect(status().isBadRequest());
        long awaSub = submissionId(awa, id, "https://github.com/awa-kone/zetsu-defi-ussd/");
        submit(awa, id, "https://github.com/awa-kone/autre")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_SUBMITTED"));
        mvc.perform(get("/api/v1/challenges/current").session(awa.session()))
                .andExpect(jsonPath("$.submissionCount").value(1))
                .andExpect(jsonPath("$.mySubmission.repositoryUrl").value("https://github.com/awa-kone/zetsu-defi-ussd"))
                .andExpect(jsonPath("$.mySubmission.status").value("PENDING"));

        // Notation : +20 une seule fois, retirés si le dépôt est finalement refusé.
        int before = reputationOf(awa);
        mvc.perform(get("/api/v1/admin/challenges/" + id + "/submissions").session(rimvie.session()))
                .andExpect(jsonPath("$.items[0].id").value(awaSub))
                .andExpect(jsonPath("$.items[0].member.username").value(awa.username()));
        review(rimvie, awaSub, "PENDING", 50).andExpect(status().isBadRequest());
        review(rimvie, awaSub, "VALIDATED", 101).andExpect(status().isBadRequest());
        review(rimvie, awaSub, "VALIDATED", 84)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VALIDATED"))
                .andExpect(jsonPath("$.score").value(84));
        review(rimvie, awaSub, "VALIDATED", 88).andExpect(status().isOk());
        assertThat(reputationOf(awa)).isEqualTo(before + 20);
        mvc.perform(get("/api/v1/notifications").session(awa.session()))
                .andExpect(jsonPath("$.items[0].type").value("SUBMISSION_REVIEWED"))
                .andExpect(jsonPath("$.items[0].outcome").value("VALIDATED"))
                .andExpect(jsonPath("$.items[0].target.type").value("CHALLENGE"));

        // Classement : deux notes égales partagent le rang.
        Member kwame = register("Kwame", "GH");
        Member chidi = register("Chidi", "NG");
        review(rimvie, submissionId(kwame, id, "https://github.com/kwame/ussd-bills"), "VALIDATED", 92);
        review(rimvie, submissionId(chidi, id, "https://github.com/chidi/ussd"), "VALIDATED", 88);
        mvc.perform(get("/api/v1/challenges/" + id + "/leaderboard"))
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.items[0].rank").value(1))
                .andExpect(jsonPath("$.items[0].member.username").value(kwame.username()))
                .andExpect(jsonPath("$.items[1].rank").value(2))
                .andExpect(jsonPath("$.items[1].member.username").value(awa.username()))
                .andExpect(jsonPath("$.items[2].rank").value(2))
                .andExpect(jsonPath("$.items[2].score").value(88));

        review(rimvie, awaSub, "REJECTED", 20).andExpect(status().isOk());
        assertThat(reputationOf(awa)).isEqualTo(before);
        mvc.perform(get("/api/v1/challenges/" + id + "/leaderboard")).andExpect(jsonPath("$.total").value(2));

        // Après la fin : plus de dépôt, le défi reste affiché avec son classement.
        at(end.plus(Duration.ofHours(1)));
        submit(register("Moussa", "ML"), id, "https://github.com/moussa/ussd")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CHALLENGE_NOT_OPEN"));
        mvc.perform(get("/api/v1/challenges/current"))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void periodeChevauchementEtModificationApresLeDebut() throws Exception {
        Instant start = newWeek();
        Instant end = start.plus(Duration.ofDays(7));
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        at(start.minus(Duration.ofDays(1)));

        mvc.perform(post("/api/v1/admin/challenges").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(challenge("Une file d'envoi hors ligne", end, start))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PERIOD"));
        long id = create(rimvie, challenge("Une file d'envoi hors ligne", start, end));
        mvc.perform(post("/api/v1/admin/challenges").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(challenge("Un autre défi la même semaine", start.plus(Duration.ofDays(3)),
                                end.plus(Duration.ofDays(3))))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CHALLENGE_OVERLAP"));

        at(start.plus(Duration.ofDays(1)));
        mvc.perform(put("/api/v1/admin/challenges/" + id).with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(challenge("Un titre changé en cours de route", start, end))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CHALLENGE_STARTED"));
        Instant later = end.plus(Duration.ofDays(1));
        mvc.perform(put("/api/v1/admin/challenges/" + id).with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(challenge("Une file d'envoi hors ligne", start, later))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endsAt").value(later.toString()));
    }
}
