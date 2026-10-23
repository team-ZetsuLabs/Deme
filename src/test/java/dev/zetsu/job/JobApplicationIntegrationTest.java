package dev.zetsu.job;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JobApplicationIntegrationTest extends IntegrationTest {

    private static final String MESSAGE = "Je construis des intégrations Orange Money depuis deux ans chez un "
            + "agrégateur à Thiès, dont la réconciliation des webhooks en double.";
    private static final byte[] PDF = "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n"
            .getBytes(StandardCharsets.US_ASCII);

    private Member fatou;
    private Member moderator;
    private long jobId;

    @BeforeEach
    void publishedJob() throws Exception {
        fatou = withRole(register("Fatou"), "RECRUITER");
        moderator = withRole(register("Rimvie"), "MODERATOR");
        MvcResult created = mvc.perform(post("/api/v1/jobs").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(JobIntegrationTest.jobBody("PERMANENT", "SN", List.of("java")))))
                .andExpect(status().isCreated()).andReturn();
        jobId = read(created).get("id").asLong();
        mvc.perform(post("/api/v1/admin/jobs/" + jobId + "/decision").with(csrf()).session(moderator.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("decision", "APPROVE"))))
                .andExpect(status().isOk());
    }

    private MockMultipartHttpServletRequestBuilder apply(Member member, String message, MockMultipartFile cv) {
        MockMultipartHttpServletRequestBuilder req = multipart("/api/v1/jobs/" + jobId + "/applications");
        if (cv != null) {
            req.file(cv);
        }
        if (message != null) {
            req.param("message", message);
        }
        req.with(csrf()).session(member.session());
        return req;
    }

    private static MockMultipartFile cv(byte[] bytes, String contentType) {
        return new MockMultipartFile("cv", "mon-cv.pdf", contentType, bytes);
    }

    @Test
    void parcoursCompletDUneCandidature() throws Exception {
        Member aminata = register("Aminata");

        MvcResult sent = mvc.perform(apply(aminata, MESSAGE, cv(PDF, "application/pdf")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SENT"))
                .andExpect(jsonPath("$.hasCv").value(true))
                .andExpect(jsonPath("$.message").value(MESSAGE))
                .andExpect(jsonPath("$.target.type").value("JOB"))
                .andExpect(jsonPath("$.target.companyName").value("Sahel Pay"))
                .andReturn();
        long applicationId = read(sent).get("id").asLong();

        mvc.perform(get("/api/v1/jobs/" + jobId).session(aminata.session()))
                .andExpect(jsonPath("$.myApplication.id").value(applicationId))
                .andExpect(jsonPath("$.myApplication.status").value("SENT"));
        mvc.perform(apply(aminata, MESSAGE, null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ALREADY_APPLIED"));

        // L'équipe consulte sans marquer comme vue ; le recruteur, si.
        mvc.perform(get("/api/v1/jobs/" + jobId + "/applications").session(moderator.session()))
                .andExpect(jsonPath("$.items[0].status").value("SENT"));
        mvc.perform(get("/api/v1/jobs/" + jobId + "/applications").session(fatou.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].status").value("VIEWED"))
                .andExpect(jsonPath("$.items[0].candidate.username").value(aminata.username()))
                .andExpect(jsonPath("$.items[0].candidate.countryCode").value("SN"));
        mvc.perform(get("/api/v1/jobs/" + jobId).session(fatou.session()))
                .andExpect(jsonPath("$.applicationCount").value(1));

        mvc.perform(patch("/api/v1/applications/" + applicationId).with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("status", "VIEWED"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_STATUS"));
        mvc.perform(patch("/api/v1/applications/" + applicationId).with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("status", "SHORTLISTED"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_TARGET_OWNER"));
        mvc.perform(patch("/api/v1/applications/" + applicationId).with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("status", "SHORTLISTED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHORTLISTED"));

        mvc.perform(get("/api/v1/users/me/applications").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].status").value("SHORTLISTED"));
        mvc.perform(get("/api/v1/users/me/applications").param("type", "MISSION").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/users/me/applications").param("status", "REJECTED").session(aminata.session()))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void leCvNestLisibleQueParLeCandidatLeRecruteurEtLEquipe() throws Exception {
        Member aminata = register("Aminata");
        Member kofi = register("Kofi");
        long applicationId = read(mvc.perform(apply(aminata, MESSAGE, cv(PDF, "application/pdf")))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        String path = "/api/v1/applications/" + applicationId + "/cv";

        for (Member allowed : List.of(aminata, fatou, moderator)) {
            mvc.perform(get(path).session(allowed.session()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                    .andExpect(header().string("Content-Disposition", containsString("attachment")))
                    .andExpect(content().bytes(PDF));
        }
        mvc.perform(get(path).session(kofi.session())).andExpect(status().isForbidden());

        long withoutCv = read(mvc.perform(apply(kofi, MESSAGE, null))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        mvc.perform(get("/api/v1/applications/" + withoutCv + "/cv").session(kofi.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CV_NOT_FOUND"));
    }

    @Test
    void leCvEstVerifieParSonContenu() throws Exception {
        Member aminata = register("Aminata");

        // Un exécutable renommé en .pdf, annoncé comme PDF, est refusé.
        mvc.perform(apply(aminata, MESSAGE, cv("MZ\u0090\u0000binaire".getBytes(StandardCharsets.ISO_8859_1),
                        "application/pdf")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CV_NOT_PDF"));

        byte[] big = new byte[(int) CvStorage.MAX_BYTES + 1];
        System.arraycopy(PDF, 0, big, 0, PDF.length);
        mvc.perform(apply(aminata, MESSAGE, cv(big, "application/pdf")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CV_TOO_LARGE"));

        // Aucune candidature n'a été enregistrée par ces essais.
        mvc.perform(apply(aminata, MESSAGE, null)).andExpect(status().isCreated());
    }

    @Test
    void leMessageEstValideEtLeRecruteurNePostulePasASonOffre() throws Exception {
        Member aminata = register("Aminata");

        mvc.perform(apply(aminata, null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.message").value("Obligatoire"));
        mvc.perform(apply(aminata, "Je suis intéressée.", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.message").value("Entre 40 et 2000 caractères"));
        mvc.perform(apply(fatou, MESSAGE, null))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("CANNOT_APPLY_OWN"));

        mvc.perform(post("/api/v1/jobs/" + jobId + "/close").with(csrf()).session(fatou.session()))
                .andExpect(status().isOk());
        mvc.perform(apply(aminata, MESSAGE, null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("JOB_CLOSED"));
    }

    @Test
    void seulLeRecruteurVoitLesCandidaturesRecues() throws Exception {
        Member kofi = register("Kofi");
        mvc.perform(get("/api/v1/jobs/" + jobId + "/applications").session(kofi.session()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("NOT_JOB_OWNER"));
    }

    @Test
    void supprimerSonCompteEffaceSesCandidaturesEtSonCv() throws Exception {
        Member aminata = register("Aminata");
        mvc.perform(apply(aminata, MESSAGE, cv(PDF, "application/pdf"))).andExpect(status().isCreated());
        String cvFile = jdbc.queryForObject("select cv_file from applications where candidate_id = ?", String.class,
                aminata.id());
        Path stored = Path.of("target/test-uploads/cv", cvFile);
        assertThat(stored).exists();

        mvc.perform(delete("/api/v1/users/me").with(csrf()).session(aminata.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", aminata.username()))))
                .andExpect(status().isNoContent());

        assertThat(jdbc.queryForObject("select count(*) from applications where candidate_id = ?", Long.class,
                aminata.id())).isZero();
        assertThat(Files.exists(stored)).isFalse();

        // Les offres d'un recruteur supprimé sont closes.
        mvc.perform(delete("/api/v1/users/me").with(csrf()).session(fatou.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", fatou.username()))))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/jobs/" + jobId)).andExpect(jsonPath("$.status").value("CLOSED"));
    }
}
