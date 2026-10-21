package dev.zetsu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zetsu.common.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Base des tests d'intégration : vraie base PostgreSQL 16 dans un conteneur, sécurité active. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("local")
@Testcontainers(disabledWithoutDocker = true)
public abstract class IntegrationTest {

    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    private RateLimiter rateLimiter;

    @BeforeEach
    void resetRateLimiter() {
        rateLimiter.reset();
        rateLimiter.setEnabled(false);
    }

    protected record Member(String username, String email, MockHttpSession session) {
    }

    protected Member register(String firstName) throws Exception {
        int n = SEQ.incrementAndGet();
        String username = firstName.toLowerCase() + "_" + n;
        String email = username + "@exemple.sn";
        MvcResult result = mvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", email, "password", "mot-de-passe-solide",
                                "username", username, "displayName", firstName + " Ndiaye"))))
                .andExpect(status().isCreated())
                .andReturn();
        return new Member(username, email, (MockHttpSession) result.getRequest().getSession(false));
    }

    protected long askQuestion(Member author, String title, String body, String country) throws Exception {
        Map<String, Object> req = Map.of("title", title, "body", body, "tags", List.of("mobile-money", "java"),
                "context", Map.of("countryCode", country, "mobileMoneyOperator", "ORANGE_MONEY",
                        "networkQuality", "MOBILE_3G"));
        MvcResult result = mvc.perform(post("/api/v1/questions").with(csrf()).session(author.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(req)))
                .andExpect(status().isCreated())
                .andReturn();
        return read(result).get("id").asLong();
    }

    protected String body(Object o) throws Exception {
        return json.writeValueAsString(o);
    }

    protected JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }
}
