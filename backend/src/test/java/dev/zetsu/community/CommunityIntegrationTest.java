package dev.zetsu.community;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** COM-1 et COM-2. La base est partagée : chaque test prend ses propres pays et des étiquettes uniques. */
class CommunityIntegrationTest extends IntegrationTest {

    private static final String BODY = "Le webhook de paiement arrive deux fois et je crédite le client deux fois de suite.";
    private static final String DESCRIPTION = "Développeurs du pays : paiements mobiles, freelance et premiers emplois.";

    private static String unique(String base) {
        return base + "-" + ThreadLocalRandom.current().nextInt(100_000, 999_999);
    }

    private static Map<String, Object> country(String name, String code) {
        Map<String, Object> req = new HashMap<>();
        req.put("name", name);
        req.put("kind", "COUNTRY");
        req.put("countryCode", code);
        req.put("description", DESCRIPTION);
        req.put("rules", List.of("On reste courtois.", "Pas d'offre d'emploi ici."));
        return req;
    }

    private static Map<String, Object> tech(String name, String tag) {
        Map<String, Object> req = new HashMap<>();
        req.put("name", name);
        req.put("kind", "TECH");
        req.put("tag", tag);
        req.put("description", DESCRIPTION);
        return req;
    }

    private void create(Member staff, Map<String, Object> req) throws Exception {
        mvc.perform(post("/api/v1/admin/communities").with(csrf()).session(staff.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(req)))
                .andExpect(status().isCreated());
    }

    @Test
    void lEquipeCreeUneCommunauteDePaysQueLOnRejointDUnClic() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        mvc.perform(post("/api/v1/admin/communities").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(country("Sénégal", "SN"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("senegal"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.rules[1]").value("Pas d'offre d'emploi ici."));
        // Même pays sous un autre nom, ou même nom : refusé.
        mvc.perform(post("/api/v1/admin/communities").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(country("Devs de Dakar", "SN"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMMUNITY_EXISTS"));
        mvc.perform(post("/api/v1/admin/communities").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(country("SÉNÉGAL", "GN"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMMUNITY_EXISTS"));
        Map<String, Object> noCountry = country("Guinée", null);
        mvc.perform(post("/api/v1/admin/communities").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(noCountry)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.countryCode").exists());

        Member aminata = register("Aminata");
        long dakar = askQuestion(aminata, "Wave renvoie deux fois le même webhook de paiement", BODY, "SN");
        long abidjan = askQuestion(aminata, "Orange Money Côte d'Ivoire refuse mon URL de retour", BODY, "CI");

        // Sans session : publique, jamais membre.
        mvc.perform(get("/api/v1/communities").param("q", "senegal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].slug").value("senegal"))
                .andExpect(jsonPath("$.items[0].joined").value(false));
        mvc.perform(get("/api/v1/communities/senegal"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sénégal"))
                .andExpect(jsonPath("$.countryCode").value("SN"))
                .andExpect(jsonPath("$.tag").doesNotExist())
                .andExpect(jsonPath("$.rules.length()").value(2))
                .andExpect(jsonPath("$.referents").isArray())
                .andExpect(jsonPath("$.topMembers").isArray());
        mvc.perform(post("/api/v1/communities/senegal/members").with(csrf()))
                .andExpect(status().isUnauthorized());

        // Rejoindre deux fois, quitter deux fois : même réponse.
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/v1/communities/senegal/members").with(csrf()).session(aminata.session()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.joined").value(true))
                    .andExpect(jsonPath("$.memberCount").value(1));
        }
        mvc.perform(get("/api/v1/communities/senegal").session(aminata.session()))
                .andExpect(jsonPath("$.joined").value(true))
                .andExpect(jsonPath("$.memberCount").value(1));
        mvc.perform(get("/api/v1/users/me/communities").session(aminata.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("senegal"));

        // Le fil filtré : les questions du pays seulement.
        var page = read(mvc.perform(get("/api/v1/questions").param("community", "senegal").param("size", "50"))
                .andExpect(status().isOk()).andReturn());
        List<Long> ids = page.get("items").findValues("id").stream().map(n -> n.asLong()).toList();
        assertThat(ids).contains(dakar).doesNotContain(abidjan);
        mvc.perform(get("/api/v1/questions").param("community", "inconnue"))
                .andExpect(jsonPath("$.total").value(0));

        for (int i = 0; i < 2; i++) {
            mvc.perform(delete("/api/v1/communities/senegal/members").with(csrf()).session(aminata.session()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.joined").value(false))
                    .andExpect(jsonPath("$.memberCount").value(0));
        }
        mvc.perform(get("/api/v1/users/me/communities").session(aminata.session()))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void uneCommunauteDeTechnoSuitSonEtiquetteEtSesMembresActifs() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        String tag = unique("flutter");
        String name = unique("Flutter");
        create(rimvie, tech(name, tag.toUpperCase()));
        String slug = CommunityService.slugify(name);

        Member kwame = register("Kwame", "GH");
        Member fatou = register("Fatou");
        long q1 = askQuestion(kwame, "Flutter : l'écran de paiement se fige sur Android Go", BODY, "GH",
                List.of(tag, "android"));
        askQuestion(kwame, "Spring Boot : webhook MTN MoMo reçu deux fois", BODY, "GH", List.of("java"));
        // Points gagnés sur une question de la communauté ce mois-ci, et un vieux gain qui ne compte plus.
        jdbc.update("insert into reputation_events (user_id, delta, reason, question_id) values (?, 25, 'ANSWER_ACCEPTED', ?)",
                fatou.id(), q1);
        jdbc.update("insert into reputation_events (user_id, delta, reason, question_id) values (?, 10, 'QUESTION_UPVOTED', ?)",
                kwame.id(), q1);
        jdbc.update("insert into reputation_events (user_id, delta, reason, question_id, created_at)"
                + " values (?, 500, 'ANSWER_ACCEPTED', ?, now() - interval '40 days')", kwame.id(), q1);

        mvc.perform(get("/api/v1/communities/" + slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kind").value("TECH"))
                .andExpect(jsonPath("$.tag").value(tag))
                .andExpect(jsonPath("$.questionCount").value(1))
                .andExpect(jsonPath("$.topMembers.length()").value(2))
                .andExpect(jsonPath("$.topMembers[0].username").value(fatou.username()))
                .andExpect(jsonPath("$.topMembers[1].username").value(kwame.username()));
        mvc.perform(get("/api/v1/communities").param("kind", "TECH").param("q", tag))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].questionCount").value(1));
        mvc.perform(get("/api/v1/communities").param("kind", "COUNTRY").param("q", tag))
                .andExpect(jsonPath("$.total").value(0));

        // L'étiquette fusionnée emmène sa communauté ; une étiquette de communauté ne se supprime pas.
        String into = unique("flutter-dev");
        mvc.perform(post("/api/v1/admin/tags").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("name", into))))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/admin/tags/" + tag + "/merge").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("into", into))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/communities/" + slug))
                .andExpect(jsonPath("$.tag").value(into))
                .andExpect(jsonPath("$.questionCount").value(1));
    }

    @Test
    void uneCommunauteFermeeDisparaitEtSesReferentsSontNommesParLEquipe() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        create(rimvie, country("Kenya", "KE"));
        Member wanjiru = withReputation(register("Wanjiru", "KE"), 1600);
        Member otieno = register("Otieno", "KE");

        mvc.perform(put("/api/v1/admin/communities/kenya/referents").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("usernames", List.of(wanjiru.username(), otieno.username())))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NOT_A_REFERENT"));
        mvc.perform(put("/api/v1/admin/communities/kenya/referents").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("usernames", List.of("personne-" + unique("x"))))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("USER_NOT_FOUND"));
        mvc.perform(put("/api/v1/admin/communities/kenya/referents").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("usernames", List.of(wanjiru.username(), wanjiru.username())))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referents.length()").value(1))
                .andExpect(jsonPath("$.memberCount").value(1));
        mvc.perform(get("/api/v1/communities/kenya"))
                .andExpect(jsonPath("$.referents[0].username").value(wanjiru.username()))
                .andExpect(jsonPath("$.referents[0].level").value("REFERENT"));

        // Modifier ne change pas l'adresse.
        Map<String, Object> renamed = country("Kenya et Ouganda", "KE");
        renamed.put("rules", List.of());
        mvc.perform(put("/api/v1/admin/communities/kenya").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(renamed)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("kenya"))
                .andExpect(jsonPath("$.name").value("Kenya et Ouganda"))
                .andExpect(jsonPath("$.rules.length()").value(0));

        mvc.perform(post("/api/v1/admin/communities/kenya/close").with(csrf()).session(rimvie.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
        mvc.perform(get("/api/v1/communities/kenya"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("COMMUNITY_NOT_FOUND"));
        mvc.perform(post("/api/v1/communities/kenya/members").with(csrf()).session(otieno.session()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/communities").param("q", "kenya"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/admin/communities").param("status", "CLOSED").param("q", "kenya")
                        .session(rimvie.session()))
                .andExpect(jsonPath("$.items[0].slug").value("kenya"));

        mvc.perform(post("/api/v1/admin/communities/kenya/reopen").with(csrf()).session(rimvie.session()))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/communities/kenya"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(1));
    }

    @Test
    void leBackOfficeEstReserveALEquipe() throws Exception {
        Member awa = withReputation(register("Awa"), 2000);
        mvc.perform(post("/api/v1/admin/communities").with(csrf()).session(awa.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(country("Mali", "ML"))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/community-proposals").session(awa.session()))
                .andExpect(status().isForbidden());
    }

    @Test
    void unReferentProposeEtLEquipeAccepteOuRefuseAvecUnMotif() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        Member ibrahima = register("Ibrahima");
        Member aminata = withReputation(register("Aminata"), 1500);
        String tag = unique("mobile-money");
        Map<String, Object> mobileMoney = tech("Mobile money " + tag.substring(tag.length() - 6), tag);
        mobileMoney.put("rules", List.of("Précisez l'opérateur : Wave, Orange Money, MTN MoMo."));

        mvc.perform(post("/api/v1/community-proposals").with(csrf()).session(ibrahima.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(mobileMoney)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LEVEL_TOO_LOW"));
        var created = read(mvc.perform(post("/api/v1/community-proposals").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(mobileMoney)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.slug").doesNotExist())
                .andReturn());
        long accepted = created.get("id").asLong();
        // Une proposition en attente sur la même étiquette : doublon.
        Map<String, Object> sameTag = tech("Autre nom " + tag.substring(tag.length() - 6), tag);
        mvc.perform(post("/api/v1/community-proposals").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(sameTag)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMMUNITY_EXISTS"));
        Map<String, Object> tooManyRules = country("Bénin", "BJ");
        tooManyRules.put("rules", List.of("1", "2", "3", "4", "5", "6"));
        mvc.perform(post("/api/v1/community-proposals").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(tooManyRules)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.rules").exists());
        long rejected = read(mvc.perform(post("/api/v1/community-proposals").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(country("Bénin", "BJ"))))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();

        mvc.perform(get("/api/v1/admin/community-proposals").session(rimvie.session()).param("size", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == " + accepted + ")].proposer.username")
                        .value(aminata.username()));

        mvc.perform(post("/api/v1/admin/community-proposals/" + rejected + "/decision").with(csrf())
                        .session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("decision", "REJECT"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("REASON_REQUIRED"));
        mvc.perform(post("/api/v1/admin/community-proposals/" + rejected + "/decision").with(csrf())
                        .session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("decision", "REJECT",
                                "reason", "La communauté Afrique de l'Ouest couvre déjà le Bénin"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(post("/api/v1/admin/community-proposals/" + accepted + "/decision").with(csrf())
                        .session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("decision", "APPROVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.slug").exists());
        mvc.perform(post("/api/v1/admin/community-proposals/" + accepted + "/decision").with(csrf())
                        .session(rimvie.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("decision", "APPROVE"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROPOSAL_NOT_PENDING"));

        var mine = read(mvc.perform(get("/api/v1/users/me/community-proposals").session(aminata.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(rejected))
                .andExpect(jsonPath("$[0].rejectionReason").value("La communauté Afrique de l'Ouest couvre déjà le Bénin"))
                .andExpect(jsonPath("$[1].id").value(accepted))
                .andExpect(jsonPath("$[1].status").value("APPROVED"))
                .andReturn());
        String slug = mine.get(1).get("slug").asText();

        // Le proposeur est le premier Référent et le premier membre.
        mvc.perform(get("/api/v1/communities/" + slug).session(aminata.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tag").value(tag))
                .andExpect(jsonPath("$.rules[0]").value("Précisez l'opérateur : Wave, Orange Money, MTN MoMo."))
                .andExpect(jsonPath("$.referents[0].username").value(aminata.username()))
                .andExpect(jsonPath("$.joined").value(true));

        mvc.perform(get("/api/v1/notifications").session(aminata.session()))
                .andExpect(jsonPath("$.items[0].type").value("COMMUNITY_PROPOSAL_DECISION"))
                .andExpect(jsonPath("$.items[0].target.type").value("COMMUNITY_PROPOSAL"))
                .andExpect(jsonPath("$.items[0].target.id").value(accepted))
                .andExpect(jsonPath("$.items[0].outcome").value("APPROVED"))
                .andExpect(jsonPath("$.items[1].outcome").value("REJECTED"))
                .andExpect(jsonPath("$.items[0].actor").doesNotExist());

        // Maintenant que la communauté existe, la proposer de nouveau est un doublon.
        mvc.perform(post("/api/v1/community-proposals").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(sameTag)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("COMMUNITY_EXISTS"));
    }

    @Test
    void lAdresseSeDeduitDuNom() {
        assertThat(CommunityService.slugify("Sénégal")).isEqualTo("senegal");
        assertThat(CommunityService.slugify("  Côte d'Ivoire ")).isEqualTo("cote-d-ivoire");
        assertThat(CommunityService.slugify("Mobile money")).isEqualTo("mobile-money");
        assertThat(CommunityService.slugify("C#")).isEqualTo("csharp");
        assertThat(CommunityService.slugify("!!!")).isEmpty();
    }
}
