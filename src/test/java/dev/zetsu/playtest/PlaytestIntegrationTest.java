package dev.zetsu.playtest;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Tests fermés Google Play : cycle d'une campagne, places, 14 jours, rappels, back office (conception, sections 5 à 9). */
class PlaytestIntegrationTest extends IntegrationTest {

    private static final String DESCRIPTION = "Tontine Cash gère les cotisations d'une tontine entre collègues : "
            + "rappels par SMS, paiement par Orange Money ou Wave, historique partagé.";

    @Autowired
    private PlaytestClock clock;

    @Autowired
    private PlaytestJobs jobs;

    private Instant now = Instant.now();

    @AfterEach
    void resetClock() {
        clock.set(Clock.systemUTC());
    }

    private void advance(Duration d) {
        now = now.plus(d);
        clock.set(Clock.fixed(now, ZoneOffset.UTC));
    }

    private Map<String, Object> campaign(String packageName, int target) {
        Map<String, Object> req = new HashMap<>();
        req.put("appName", "Tontine Cash");
        req.put("packageName", packageName);
        req.put("description", DESCRIPTION);
        req.put("optInUrl", "https://play.google.com/apps/testing/" + packageName);
        req.put("testersTarget", target);
        req.put("instructions", "Créez une tontine de test et invitez un ami.");
        return req;
    }

    private JsonNode create(Member owner, String packageName, int target) throws Exception {
        return read(mvc.perform(post("/api/v1/playtests").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(campaign(packageName, target))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn());
    }

    /** Porteur de confiance (50 points) : sa campagne est publiée sans relecture. */
    private long active(Member owner, String packageName, int target) throws Exception {
        withReputation(owner, 50);
        long id = create(owner, packageName, target).get("id").asLong();
        action(owner, "/api/v1/playtests/{id}/submit", id).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        return id;
    }

    private ResultActions action(Member member, String path, Object... vars) throws Exception {
        return mvc.perform(post(path, vars).with(csrf()).session(member.session()));
    }

    private ResultActions send(Member member, String path, Object payload, Object... vars) throws Exception {
        return mvc.perform(post(path, vars).with(csrf()).session(member.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(payload)));
    }

    private ResultActions join(Member tester, long id) throws Exception {
        return action(tester, "/api/v1/playtests/{id}/participations", id);
    }

    private List<String> notificationsOf(Member member) {
        return jdbc.queryForList("select type from notifications where recipient_id = ? order by id", String.class,
                member.id());
    }

    @Test
    void unNouveauPorteurPasseParLEquipeEtCorrigeApresUnRefus() throws Exception {
        Member owner = register("Aminata");
        Member stranger = register("Moussa");
        Member moderator = withRole(register("Awa"), "MODERATOR");
        long id = create(owner, "sn.tontinecash.app", 14).get("id").asLong();

        // Un brouillon n'existe que pour son porteur.
        mvc.perform(get("/api/v1/playtests/{id}", id).session(stranger.session())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/playtests/{id}", id).session(owner.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.canEdit").value(true)).andExpect(jsonPath("$.canSubmit").value(true))
                .andExpect(jsonPath("$.optInUrl").value("https://play.google.com/apps/testing/sn.tontinecash.app"));

        action(owner, "/api/v1/playtests/{id}/submit", id).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
        mvc.perform(put("/api/v1/playtests/{id}", id).with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(campaign("sn.tontinecash.app", 20))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PLAYTEST_NOT_EDITABLE"));

        // Un membre n'accède pas au back office ; un refus demande un motif.
        send(stranger, "/api/v1/admin/playtests/{id}/review", Map.of("decision", "APPROVE"), id)
                .andExpect(status().isForbidden());
        send(moderator, "/api/v1/admin/playtests/{id}/review", Map.of("decision", "REJECT"), id)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("NOTE_REQUIRED"));
        send(moderator, "/api/v1/admin/playtests/{id}/review",
                Map.of("decision", "REJECT", "note", "Le lien ne mène pas à un test fermé"), id)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(get("/api/v1/playtests/{id}", id).session(owner.session()))
                .andExpect(jsonPath("$.reviewNote").value("Le lien ne mène pas à un test fermé"));

        // Corrigée, elle redevient un brouillon à renvoyer.
        mvc.perform(put("/api/v1/playtests/{id}", id).with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(campaign("sn.tontinecash.app", 20))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.testersTarget").value(20));
        action(owner, "/api/v1/playtests/{id}/submit", id).andExpect(jsonPath("$.status").value("PENDING_REVIEW"));
        mvc.perform(get("/api/v1/admin/playtests").param("status", "PENDING_REVIEW").session(moderator.session()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[*].campaign.id", hasItem((int) id)));
        send(moderator, "/api/v1/admin/playtests/{id}/review", Map.of("decision", "APPROVE"), id)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"));

        // Publiée : listée, mais le lien d'inscription n'est donné qu'après avoir rejoint.
        mvc.perform(get("/api/v1/playtests")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", hasItem((int) id)));
        mvc.perform(get("/api/v1/playtests/{id}", id).session(stranger.session()))
                .andExpect(jsonPath("$.optInUrl").value(nullValue()))
                .andExpect(jsonPath("$.reviewNote").value(nullValue()))
                .andExpect(jsonPath("$.canJoin").value(true));
        assertThat(notificationsOf(owner)).containsExactly("PLAYTEST_CAMPAIGN_REVIEWED", "PLAYTEST_CAMPAIGN_REVIEWED");

        mvc.perform(get("/api/v1/admin/playtests/{id}/events", id).session(moderator.session()))
                .andExpect(jsonPath("$.items[0].action").value("APPROVED"))
                .andExpect(jsonPath("$.items[0].actor.username").value(moderator.username()))
                .andExpect(jsonPath("$.total").value(6));
    }

    @Test
    void liensEtIdentifiantsVerifies() throws Exception {
        Member owner = register("Kouassi");
        Map<String, Object> bad = campaign("sn.tontine.app", 14);
        bad.put("optInUrl", "javascript:alert(1)");
        bad.put("packageName", "tontine");
        bad.put("testersTarget", 5);
        mvc.perform(post("/api/v1/playtests").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.optInUrl").exists())
                .andExpect(jsonPath("$.fields.packageName").exists())
                .andExpect(jsonPath("$.fields.testersTarget").exists());

        // Description nettoyée côté serveur.
        Map<String, Object> trap = campaign("sn.piege.app", 14);
        trap.put("description", DESCRIPTION + " <script>alert(1)</script><img src=x onerror=alert(1)>");
        JsonNode created = read(mvc.perform(post("/api/v1/playtests").with(csrf()).session(owner.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(trap)))
                .andExpect(status().isCreated()).andReturn());
        assertThat(created.get("descriptionHtml").asText()).doesNotContain("<script").doesNotContain("<img");

        mvc.perform(get("/api/v1/playtests/mine")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/playtests/mine").session(owner.session()))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void uneSeuleCampagneEnCoursParApplication() throws Exception {
        Member owner = register("Chinedu", "NG");
        active(owner, "ng.paystack.demo", 12);
        long second = create(owner, "ng.paystack.demo", 12).get("id").asLong();
        action(owner, "/api/v1/playtests/{id}/submit", second)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PACKAGE_ALREADY_RUNNING"));
    }

    @Test
    void lesPlacesSontComptéesEtUnePlaceLibereeEstReprise() throws Exception {
        Member owner = register("Wanjiru", "KE");
        long id = active(owner, "ke.mpesa.split", 12);
        join(owner, id).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("CANNOT_JOIN_OWN"));

        List<Member> testers = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            Member t = register("Testeur");
            testers.add(t);
            join(t, id).andExpect(status().isCreated())
                    .andExpect(jsonPath("$.myParticipation.status").value("JOINED"))
                    .andExpect(jsonPath("$.optInUrl").value("https://play.google.com/apps/testing/ke.mpesa.split"));
        }
        join(testers.get(0), id).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("ALREADY_JOINED"));
        Member late = register("Fatou");
        join(late, id).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CAMPAIGN_FULL"));
        mvc.perform(get("/api/v1/playtests").param("availability", "FULL"))
                .andExpect(jsonPath("$.items[*].id", hasItem((int) id)));
        mvc.perform(get("/api/v1/playtests").param("availability", "OPEN"))
                .andExpect(jsonPath("$.items[*].id", not(hasItem((int) id))));
        assertThat(notificationsOf(owner)).contains("PLAYTEST_CAMPAIGN_FULL");

        // Un désistement libère une place, reprise par le suivant ; on ne revient jamais sur une campagne quittée.
        long leaving = read(send(testers.get(3), "/api/v1/playtests/{id}/participations/me/withdraw",
                Map.of("reason", "Téléphone en panne"), id).andExpect(status().isOk()).andReturn())
                .get("myParticipation").get("id").asLong();
        join(late, id).andExpect(status().isCreated());
        join(testers.get(3), id).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("ALREADY_JOINED"));
        JsonNode list = read(mvc.perform(get("/api/v1/playtests/{id}/participations", id).session(owner.session()))
                .andExpect(status().isOk()).andReturn());
        JsonNode replacement = list.get(list.size() - 1);
        assertThat(replacement.get("tester").get("username").asText()).isEqualTo(late.username());
        assertThat(replacement.get("replacesId").asLong()).isEqualTo(leaving);
        assertThat(notificationsOf(owner)).contains("PLAYTEST_TESTER_LEFT", "PLAYTEST_TESTER_REPLACED");

        // La liste des testeurs n'est qu'au porteur.
        mvc.perform(get("/api/v1/playtests/{id}/participations", id).session(late.session()))
                .andExpect(status().isForbidden());
    }

    @Test
    void quatorzeJoursDeclaresPuisTerminesRapportentCinqPoints() throws Exception {
        Member owner = register("Kwame", "GH");
        long id = active(owner, "gh.momo.budget", 12);
        Member tester = register("Amina");
        join(tester, id).andExpect(status().isCreated());
        advance(Duration.ZERO);

        action(tester, "/api/v1/playtests/{id}/participations/me/check-in", id)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PARTICIPATION_NOT_RUNNING"));
        send(tester, "/api/v1/playtests/{id}/participations/me/confirm",
                Map.of("googleEmail", "amina.testeuse@gmail.com"), id).andExpect(status().isOk())
                .andExpect(jsonPath("$.myParticipation.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.myParticipation.proofLevel").value("DECLARED"))
                .andExpect(jsonPath("$.myParticipation.daysDone").value(0));
        assertThat(notificationsOf(owner)).contains("PLAYTEST_JOINED");

        advance(Duration.ofHours(1));
        action(tester, "/api/v1/playtests/{id}/participations/me/check-in", id).andExpect(status().isOk())
                .andExpect(jsonPath("$.myParticipation.checkedInToday").value(true));
        action(tester, "/api/v1/playtests/{id}/participations/me/check-in", id)
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("ALREADY_CHECKED_IN"));

        // Le porteur vérifie dans la Play Console ; l'adresse Google n'est qu'à lui.
        JsonNode participants = read(mvc.perform(get("/api/v1/playtests/{id}/participations", id)
                .session(owner.session())).andReturn());
        long pid = participants.get(0).get("id").asLong();
        assertThat(participants.get(0).get("googleEmail").asText()).isEqualTo("amina.testeuse@gmail.com");
        action(owner, "/api/v1/playtests/{id}/participations/{pid}/verify", id, pid).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].proofLevel").value("VERIFIED"));

        // 4 jours sans « toujours inscrit » : rappel, et « à confirmer » pour le porteur. Jamais d'abandon automatique.
        advance(Duration.ofDays(4));
        jobs.run();
        jobs.run();
        assertThat(notificationsOf(tester)).containsOnlyOnce("PLAYTEST_STAY_REMINDER");
        mvc.perform(get("/api/v1/playtests/{id}/participations", id).session(owner.session()))
                .andExpect(jsonPath("$[0].needsAttention").value(true))
                .andExpect(jsonPath("$[0].status").value("VERIFIED"))
                .andExpect(jsonPath("$[0].daysDone").value(4));

        advance(Duration.ofDays(8));
        jobs.run();
        assertThat(notificationsOf(tester)).containsOnlyOnce("PLAYTEST_ENDING_SOON");

        advance(Duration.ofDays(2));
        jobs.run();
        jobs.run();
        mvc.perform(get("/api/v1/users/me/playtest-participations").session(tester.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].participation.status").value("COMPLETED"))
                .andExpect(jsonPath("$.items[0].participation.proofLevel").value("COMPLETED"))
                .andExpect(jsonPath("$.items[0].participation.daysDone").value(14))
                .andExpect(jsonPath("$.items[0].campaign.progress.completed").value(1));
        assertThat(notificationsOf(tester)).containsOnlyOnce("PLAYTEST_PARTICIPATION_DONE");
        Integer points = jdbc.queryForObject("select reputation from users where id = ?", Integer.class, tester.id());
        assertThat(points).isEqualTo(5);
        Integer events = jdbc.queryForObject(
                "select count(*) from reputation_events where user_id = ? and reason = 'PLAYTEST_COMPLETED'",
                Integer.class, tester.id());
        assertThat(events).isEqualTo(1);

        // L'adresse Google est effacée 30 jours après la fin.
        advance(Duration.ofDays(31));
        jobs.run();
        mvc.perform(get("/api/v1/playtests/{id}/participations", id).session(owner.session()))
                .andExpect(jsonPath("$[0].googleEmail").value(nullValue()));
    }

    @Test
    void sansInstallationDeclareeLaPlaceSeLibereApres48Heures() throws Exception {
        Member owner = register("Fatou");
        long id = active(owner, "sn.wave.tickets", 12);
        Member tester = register("Ibrahima");
        join(tester, id).andExpect(status().isCreated())
                .andExpect(jsonPath("$.myParticipation.confirmBefore").exists());
        advance(Duration.ofHours(25));
        jobs.run();
        assertThat(notificationsOf(tester)).containsOnlyOnce("PLAYTEST_INSTALL_REMINDER");
        advance(Duration.ofHours(24));
        jobs.run();
        mvc.perform(get("/api/v1/playtests/{id}", id).session(tester.session()))
                .andExpect(jsonPath("$.myParticipation.status").value("DROPPED"))
                .andExpect(jsonPath("$.myParticipation.dropReason").value(PlaytestJobs.EXPIRED_REASON))
                .andExpect(jsonPath("$.spotsLeft").value(12))
                .andExpect(jsonPath("$.canJoin").value(false));
        assertThat(notificationsOf(owner)).contains("PLAYTEST_TESTER_LEFT");
    }

    @Test
    void lEquipeSuspendRetireUnTesteurEtSuitLesIndicateurs() throws Exception {
        Member owner = register("Moussa");
        long id = active(owner, "ml.orange.cashback", 12);
        Member tester = register("Awa");
        Member other = register("Kofi");
        Member admin = withRole(register("Rimvie"), "ADMIN");
        join(tester, id).andExpect(status().isCreated());
        join(other, id).andExpect(status().isCreated());

        send(admin, "/api/v1/admin/playtests/{id}/suspend", Map.of(), id)
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("NOTE_REQUIRED"));
        send(admin, "/api/v1/admin/playtests/{id}/suspend",
                Map.of("note", "Plusieurs signalements d'accès abusifs"), id)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("SUSPENDED"));
        // Invisible des autres, toujours visible de ses testeurs ; plus de nouvelles places.
        Member stranger = register("Yaw");
        mvc.perform(get("/api/v1/playtests/{id}", id).session(stranger.session())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/playtests/{id}", id).session(tester.session())).andExpect(status().isOk());
        join(stranger, id).andExpect(status().isNotFound());

        long pid = read(mvc.perform(get("/api/v1/admin/playtests/{id}/participations", id).session(admin.session()))
                .andExpect(status().isOk()).andReturn()).get(1).get("id").asLong();
        send(admin, "/api/v1/admin/playtests/{id}/participations/{pid}/remove",
                Map.of("reason", "Compte créé pour gonfler les compteurs"), id, pid)
                .andExpect(status().isOk()).andExpect(jsonPath("$[1].status").value("REMOVED"));
        assertThat(notificationsOf(other)).contains("PLAYTEST_REMOVED");

        action(admin, "/api/v1/admin/playtests/{id}/reactivate", id).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Sans participation depuis 7 jours : signalée « inactive ».
        advance(Duration.ofDays(8));
        mvc.perform(get("/api/v1/admin/playtests").param("problem", "INACTIVE").session(admin.session()))
                .andExpect(jsonPath("$.items[*].campaign.id", hasItem((int) id)))
                .andExpect(jsonPath("$.items[0].inactive").value(true));
        mvc.perform(get("/api/v1/admin/playtests/stats").session(admin.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.active").isNumber())
                .andExpect(jsonPath("$.participationsRunning").isNumber());
        mvc.perform(get("/api/v1/admin/playtests/stats").session(tester.session())).andExpect(status().isForbidden());

        // Le porteur clôture : plus personne ne rejoint.
        action(owner, "/api/v1/playtests/{id}/close", id).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        join(stranger, id).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("PLAYTEST_NOT_ACTIVE"));
    }

    @Test
    void uneCampagneSeSignaleEtSeMasqueCommeLesAutresContenus() throws Exception {
        Member owner = register("Kouame");
        long id = active(owner, "ci.djamo.quiz", 12);
        Member reporter = withReputation(register("Mariam"), 60);
        mvc.perform(post("/api/v1/reports").with(csrf()).session(reporter.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("targetType", "PLAYTEST", "targetId", id, "reason", "SPAM"))))
                .andExpect(status().isCreated());
        jdbc.update("update test_campaigns set hidden = true where id = ?", id);
        mvc.perform(get("/api/v1/playtests/{id}", id).session(reporter.session())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/playtests")).andExpect(jsonPath("$.items[*].id", not(hasItem((int) id))));
    }
}
