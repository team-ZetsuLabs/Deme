package dev.zetsu.user;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.RequestBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OnboardingIntegrationTest extends IntegrationTest {

    @Test
    void unNouveauMembreDoitPasserParLAccueil() throws Exception {
        Member awa = register("Awa", "CI");

        mvc.perform(get("/api/v1/auth/me").session(awa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(false))
                .andExpect(jsonPath("$.technologies", empty()));
    }

    @Test
    void laccueilEnregistreStackPaysEtLangue() throws Exception {
        Member awa = register("Awa", "CI");

        mvc.perform(onboarding(awa, List.of("Spring Boot", "java", "PostgreSQL", "java"), "SN", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true))
                .andExpect(jsonPath("$.technologies", contains("spring-boot", "java", "postgresql")))
                .andExpect(jsonPath("$.countryCode").value("SN"))
                .andExpect(jsonPath("$.language").value("en"));

        mvc.perform(get("/api/v1/users/" + awa.username()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies", contains("spring-boot", "java", "postgresql")));

        // Rappeler l'accueil corrige les choix sans le remettre à zéro.
        mvc.perform(onboarding(awa, List.of("kotlin"), "SN", "fr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true))
                .andExpect(jsonPath("$.technologies", contains("kotlin")));
    }

    @Test
    void laccueilDemandeAuMoinsUneTechnologieEtUnPays() throws Exception {
        Member kofi = register("Kofi", "GH");

        mvc.perform(onboarding(kofi, List.of(), "", "fr"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.technologies").value("Obligatoire"))
                .andExpect(jsonPath("$.fields.countryCode").value("Obligatoire"));

        mvc.perform(onboarding(kofi, List.of("   "), "GH", "fr"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TAG_REQUIRED"));

        mvc.perform(onboarding(kofi, List.of("java", "<script>"), "GH", "fr"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_TAG"));

        List<String> eleven = List.of("a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11");
        mvc.perform(onboarding(kofi, eleven, "GH", "fr"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.technologies").value("10 technologies maximum"));
    }

    @Test
    void laccueilDemandeUneSession() throws Exception {
        mvc.perform(put("/api/v1/users/me/onboarding").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("technologies", List.of("java"), "countryCode", "SN", "language", "fr"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void leProfilGardeSaStackSiLeChampEstAbsent() throws Exception {
        Member njeri = register("Njeri", "KE");
        mvc.perform(onboarding(njeri, List.of("python", "django"), "KE", "en")).andExpect(status().isOk());

        Map<String, Object> profile = new HashMap<>(Map.of("displayName", "Njeri Wanjiku", "language", "en",
                "visibleToRecruiters", true));
        mvc.perform(updateProfile(njeri, profile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies", contains("python", "django")));

        profile.put("technologies", List.of("go"));
        mvc.perform(updateProfile(njeri, profile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies", contains("go")));

        profile.put("technologies", List.of());
        mvc.perform(updateProfile(njeri, profile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies", empty()));
    }

    private RequestBuilder onboarding(Member member, List<String> technologies, String country, String language)
            throws Exception {
        return put("/api/v1/users/me/onboarding").with(csrf()).session(member.session())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("technologies", technologies, "countryCode", country, "language", language)));
    }

    private RequestBuilder updateProfile(Member member, Map<String, Object> req) throws Exception {
        return put("/api/v1/users/me").with(csrf()).session(member.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(req));
    }
}
