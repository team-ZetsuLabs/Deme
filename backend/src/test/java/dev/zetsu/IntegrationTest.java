package dev.zetsu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.zetsu.auth.LoginAttempts;
import dev.zetsu.common.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
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
@TestPropertySource(properties = "zetsu.uploads-dir=target/test-uploads")
@Testcontainers(disabledWithoutDocker = true)
public abstract class IntegrationTest {

    protected static final String PASSWORD = "dakar2026";
    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    private RateLimiter rateLimiter;

    @Autowired
    private LoginAttempts loginAttempts;

    @BeforeEach
    void resetLimits() {
        rateLimiter.reset();
        rateLimiter.setEnabled(false);
        loginAttempts.reset();
    }

    protected record Member(long id, String username, String email, MockHttpSession session) {
    }

    protected Member register(String firstName) throws Exception {
        return register(firstName, "SN");
    }

    protected Member register(String firstName, String country) throws Exception {
        int n = SEQ.incrementAndGet();
        String email = firstName.toLowerCase() + "." + n + "@exemple.sn";
        MvcResult result = mvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("displayName", firstName + " Ndiaye " + n, "email", email,
                                "countryCode", country, "password", PASSWORD))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode me = read(result);
        return new Member(me.get("id").asLong(), me.get("username").asText(), email,
                (MockHttpSession) result.getRequest().getSession(false));
    }

    /** Nouvelle session, par exemple pour prendre en compte un rôle changé en base (il est lu à la connexion). */
    protected Member login(Member member) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(Map.of("email", member.email(), "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
        return new Member(member.id(), member.username(), member.email(),
                (MockHttpSession) result.getRequest().getSession(false));
    }

    /** Change le rôle en base (ce que fera le back office) puis rouvre une session qui le porte. */
    protected Member withRole(Member member, String role) throws Exception {
        jdbc.update("update users set role = ? where id = ?", role, member.id());
        return login(member);
    }

    /** Donne de la réputation directement en base, pour atteindre un niveau sans dérouler tout un scénario. */
    protected Member withReputation(Member member, int reputation) {
        jdbc.update("update users set reputation = ? where id = ?", reputation, member.id());
        return member;
    }

    protected long askQuestion(Member author, String title, String body, String country) throws Exception {
        return askQuestion(author, title, body, country, List.of("mobile-money", "java"));
    }

    protected long askQuestion(Member author, String title, String body, String country, List<String> tags)
            throws Exception {
        Map<String, Object> req = Map.of("title", title, "body", body, "tags", tags,
                "context", Map.of("countryCode", country, "mobileMoneyOperator", "ORANGE_MONEY",
                        "networkQuality", "UNSTABLE", "techVersion", "Spring Boot 3.3"));
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
