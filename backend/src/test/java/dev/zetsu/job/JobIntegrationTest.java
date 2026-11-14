package dev.zetsu.job;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.RequestBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JobIntegrationTest extends IntegrationTest {

    static final String DESCRIPTION = "Sahel Pay construit l'encaissement mobile money pour les commerçants d'Afrique "
            + "de l'Ouest. Vous concevez les API d'encaissement Orange Money et Wave et fiabilisez les webhooks.";
    private static final AtomicInteger SEQ = new AtomicInteger();

    /** Technologie propre au test, pour filtrer la liste partagée par toute la classe. */
    static String uniqueTech() {
        return "tech-" + SEQ.incrementAndGet() + "-" + System.nanoTime() % 100000;
    }

    static Map<String, Object> jobBody(String type, String country, List<String> technologies) {
        Map<String, Object> body = new HashMap<>(Map.of("title", "Développeur back-end Java, paiements mobiles",
                "companyName", "Sahel Pay", "type", type, "technologies", technologies, "description", DESCRIPTION,
                "compensation", "900 000 à 1 300 000 XOF par mois", "city", "Dakar"));
        if (country != null) {
            body.put("countryCode", country);
        }
        return body;
    }

    long createJob(Member recruiter, Map<String, Object> body) throws Exception {
        return read(mvc.perform(post("/api/v1/jobs").with(csrf()).session(recruiter.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn()).get("id").asLong();
    }

    RequestBuilder decide(Member moderator, long jobId, String decision, String reason) throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("decision", decision));
        if (reason != null) {
            req.put("reason", reason);
        }
        return post("/api/v1/admin/jobs/" + jobId + "/decision").with(csrf()).session(moderator.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(req));
    }

    @Test
    void seulUnRecruteurPublie() throws Exception {
        Member awa = register("Awa");
        mvc.perform(post("/api/v1/jobs").with(csrf()).session(awa.session()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(jobBody("PERMANENT", "SN", List.of("java")))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("RECRUITER_ONLY"));
    }

    @Test
    void uneOffreEnAttenteNestVisibleQueParSonRecruteurEtLEquipe() throws Exception {
        Member fatou = withRole(register("Fatou"), "RECRUITER");
        Member moderator = withRole(register("Rimvie"), "MODERATOR");
        Member awa = register("Awa");
        String tech = uniqueTech();
        long id = createJob(fatou, jobBody("PERMANENT", "SN", List.of("java", tech)));

        mvc.perform(get("/api/v1/jobs/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/jobs/" + id).session(awa.session())).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/jobs").param("technology", tech)).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/jobs/" + id).session(fatou.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.canEdit").value(true))
                .andExpect(jsonPath("$.applicationCount").value(0));
        mvc.perform(get("/api/v1/jobs/mine").session(fatou.session()))
                .andExpect(jsonPath("$.items[0].id").value(id))
                .andExpect(jsonPath("$.items[0].status").value("PENDING"));

        mvc.perform(get("/api/v1/admin/jobs").session(moderator.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == " + id + ")]").exists());
        mvc.perform(decide(moderator, id, "APPROVE", null))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        mvc.perform(get("/api/v1/jobs/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recruiter.username").value(fatou.username()))
                .andExpect(jsonPath("$.applicationCount").doesNotExist())
                .andExpect(jsonPath("$.canEdit").value(false));
        mvc.perform(decide(moderator, id, "REJECT", "Trop tard")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("JOB_NOT_PENDING"));
    }

    @Test
    void unRefusDemandeUnMotifMontreAuRecruteur() throws Exception {
        Member fatou = withRole(register("Fatou"), "RECRUITER");
        Member moderator = withRole(register("Rimvie"), "MODERATOR");
        long id = createJob(fatou, jobBody("REMOTE", null, List.of("flutter")));

        mvc.perform(decide(moderator, id, "REJECT", "  ")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("REASON_REQUIRED"));
        mvc.perform(decide(moderator, id, "REJECT", "Précisez la rémunération avant publication."))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        mvc.perform(get("/api/v1/jobs/" + id).session(fatou.session()))
                .andExpect(jsonPath("$.rejectionReason").value("Précisez la rémunération avant publication."));

        // Corriger l'offre la renvoie en validation, sans l'ancien motif.
        mvc.perform(put("/api/v1/jobs/" + id).with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(jobBody("REMOTE", null, List.of("flutter")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.rejectionReason").doesNotExist());
    }

    @Test
    void listeFiltreeEtCorrespondanceAvecLaStack() throws Exception {
        Member fatou = withRole(register("Fatou"), "RECRUITER");
        Member moderator = withRole(register("Rimvie"), "MODERATOR");
        String tech = uniqueTech();
        long dakar = createJob(fatou, jobBody("PERMANENT", "SN", List.of("java", "spring-boot", tech)));
        long remote = createJob(fatou, jobBody("REMOTE", null, List.of("flutter", tech)));
        long pending = createJob(fatou, jobBody("PERMANENT", "SN", List.of(tech)));
        mvc.perform(decide(moderator, dakar, "APPROVE", null)).andExpect(status().isOk());
        mvc.perform(decide(moderator, remote, "APPROVE", null)).andExpect(status().isOk());

        mvc.perform(get("/api/v1/jobs").param("technology", tech))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].id").value(remote))
                .andExpect(jsonPath("$.items[1].id").value(dakar))
                .andExpect(jsonPath("$.items[0].matchPercent").doesNotExist());
        mvc.perform(get("/api/v1/jobs").param("technology", tech).param("type", "PERMANENT").param("country", "SN"))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(dakar));
        mvc.perform(get("/api/v1/jobs").param("country", "XX")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_COUNTRY"));

        Member aminata = register("Aminata");
        mvc.perform(put("/api/v1/users/me/onboarding").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("technologies", List.of("spring-boot", "java", "postgresql"),
                                "countryCode", "SN", "language", "fr"))))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/jobs").param("technology", tech).session(aminata.session()))
                .andExpect(jsonPath("$.items[0].matchPercent").value(0))
                .andExpect(jsonPath("$.items[1].matchPercent").value(67));
        mvc.perform(get("/api/v1/jobs/" + dakar).session(aminata.session()))
                .andExpect(jsonPath("$.match.matched", contains("java", "spring-boot")))
                .andExpect(jsonPath("$.match.missing", contains(tech)))
                .andExpect(jsonPath("$.match.percent").value(67));
        mvc.perform(get("/api/v1/jobs/" + pending).session(aminata.session())).andExpect(status().isNotFound());
    }

    @Test
    void laDescriptionEstNettoyee() throws Exception {
        Member fatou = withRole(register("Fatou"), "RECRUITER");
        Map<String, Object> body = jobBody("CONTRACT", "CI", List.of("php"));
        // Le lien a son propre paragraphe : derrière une ligne qui commence par <script>, CommonMark n'en ferait
        // pas un lien du tout et le test ne prouverait rien.
        body.put("description", DESCRIPTION + "\n\n<script>alert(1)</script><img src=x onerror=alert(1)>"
                + "\n\nPour [postuler](javascript:alert(1)), lisez [la fiche](https://sahelpay.example/poste).");
        long id = createJob(fatou, body);

        mvc.perform(get("/api/v1/jobs/" + id).session(fatou.session()))
                .andExpect(jsonPath("$.descriptionHtml", not(containsString("<script"))))
                .andExpect(jsonPath("$.descriptionHtml", not(containsString("<img"))))
                .andExpect(jsonPath("$.descriptionHtml", not(containsString("javascript:"))))
                .andExpect(jsonPath("$.descriptionHtml", containsString("href=\"https://sahelpay.example/poste\"")));
    }

    @Test
    void seulLeRecruteurModifieEtClotSonOffre() throws Exception {
        Member fatou = withRole(register("Fatou"), "RECRUITER");
        Member other = withRole(register("Kofi"), "RECRUITER");
        long id = createJob(fatou, jobBody("INTERNSHIP", "KE", List.of("react")));

        mvc.perform(post("/api/v1/jobs/" + id + "/close").with(csrf()).session(other.session()))
                .andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/jobs/" + id + "/close").with(csrf()).session(fatou.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"))
                .andExpect(jsonPath("$.canEdit").value(false));
        mvc.perform(put("/api/v1/jobs/" + id).with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(jobBody("INTERNSHIP", "KE", List.of("react")))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("JOB_CLOSED"));

        Map<String, Object> invalid = jobBody("INTERNSHIP", "KE", List.of("react"));
        invalid.put("companyWebsite", "javascript:alert(1)");
        mvc.perform(post("/api/v1/jobs").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.companyWebsite").value("Adresse en https:// attendue"));
    }
}
