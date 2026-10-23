package dev.zetsu.tag;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** MOD-4 : étiquettes dans le back office. Noms uniques par test, la base étant partagée. */
class TagAdminIntegrationTest extends IntegrationTest {

    private static final String BODY = "Mon paiement mobile passe côté client mais le webhook n'arrive jamais sur mon serveur Spring Boot.";

    private static String unique(String base) {
        return base + "-" + ThreadLocalRandom.current().nextInt(100_000, 999_999);
    }

    @Test
    void creerUneEtiquette() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        String name = unique("wave");
        mvc.perform(post("/api/v1/admin/tags").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("name", "  " + name.toUpperCase()))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(name))
                .andExpect(jsonPath("$.questionCount").value(0));
        mvc.perform(post("/api/v1/admin/tags").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("name", name))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TAG_EXISTS"));
        mvc.perform(post("/api/v1/admin/tags").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("name", "!!"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_TAG"));
    }

    @Test
    void fusionnerDeplaceTousLesUsagesSansDoublon() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        String from = unique("momo");
        String into = unique("mobilemoney");
        Member aminata = register("Aminata");
        long onlyFrom = askQuestion(aminata, "Le webhook MTN MoMo n'arrive jamais sur mon serveur", BODY, "CI",
                List.of(from, "java"));
        long both = askQuestion(aminata, "Webhook MoMo et mobile money reçu deux fois de suite", BODY, "CI",
                List.of(from, into));
        mvc.perform(put("/api/v1/users/me/onboarding").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("technologies", List.of(from, "java"), "countryCode", "CI",
                                "language", "fr"))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/admin/tags/" + from + "/merge").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("into", from))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SAME_TAG"));
        mvc.perform(post("/api/v1/admin/tags/" + from + "/merge").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("into", into))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(into))
                .andExpect(jsonPath("$.questionCount").value(2))
                .andExpect(jsonPath("$.memberCount").value(1));

        mvc.perform(get("/api/v1/questions/" + onlyFrom))
                .andExpect(jsonPath("$.tags[0]").value("java"))
                .andExpect(jsonPath("$.tags[1]").value(into));
        mvc.perform(get("/api/v1/questions/" + both))
                .andExpect(jsonPath("$.tags.length()").value(1))
                .andExpect(jsonPath("$.tags[0]").value(into));
        mvc.perform(get("/api/v1/questions").param("tag", into)).andExpect(jsonPath("$.total").value(2));
        // tags_text recalculé : la recherche plein texte trouve la question par sa nouvelle étiquette.
        mvc.perform(get("/api/v1/questions").param("q", into)).andExpect(jsonPath("$.total").value(2));
        mvc.perform(get("/api/v1/auth/me").session(aminata.session()))
                .andExpect(jsonPath("$.technologies[0]").value(into))
                .andExpect(jsonPath("$.technologies[1]").value("java"));
        mvc.perform(post("/api/v1/admin/tags/" + from + "/merge").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("into", into))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TAG_NOT_FOUND"));
    }

    @Test
    void onNeSupprimeQuUneEtiquetteInutilisee() throws Exception {
        Member rimvie = withRole(register("Rimvie"), "MODERATOR");
        String used = unique("ussd");
        String unused = unique("orange");
        askQuestion(register("Moussa", "ML"), "Comment tester un menu USSD sans téléphone ?", BODY, "ML",
                List.of(used));
        mvc.perform(post("/api/v1/admin/tags").with(csrf()).session(rimvie.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("name", unused))))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/admin/tags").param("q", unused.substring(0, 8)).param("unused", "true")
                        .session(rimvie.session()))
                .andExpect(jsonPath("$.items[?(@.name == '" + unused + "')]").exists());
        mvc.perform(delete("/api/v1/admin/tags/" + used).with(csrf()).session(rimvie.session()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TAG_IN_USE"));
        mvc.perform(delete("/api/v1/admin/tags/" + unused).with(csrf()).session(rimvie.session()))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/v1/admin/tags/" + unused).with(csrf()).session(rimvie.session()))
                .andExpect(status().isNotFound());
    }
}
