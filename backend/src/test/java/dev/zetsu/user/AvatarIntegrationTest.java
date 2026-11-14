package dev.zetsu.user;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** SET-1 : photo de profil vérifiée par son contenu, servie seulement tant qu'elle est celle du profil. */
class AvatarIntegrationTest extends IntegrationTest {

    private static final Path DIR = Path.of("target/test-uploads/avatars");

    private static byte[] image(byte[] signature, int size) {
        byte[] data = Arrays.copyOf(signature, size);
        Arrays.fill(data, signature.length, size, (byte) 7);
        return data;
    }

    private static final byte[] PNG = image(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'}, 2048);
    private static final byte[] JPEG = image(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}, 2048);
    private static final byte[] WEBP = image("RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.US_ASCII), 2048);

    private ResultActions upload(Member member, byte[] data, String filename, String contentType) throws Exception {
        return mvc.perform(multipart(HttpMethod.PUT, "/api/v1/users/me/avatar")
                .file(new MockMultipartFile("photo", filename, contentType, data))
                .with(csrf()).session(member.session()));
    }

    private String avatarUrl(Member member, byte[] data, String filename, String contentType) throws Exception {
        return read(upload(member, data, filename, contentType).andExpect(status().isOk()).andReturn())
                .get("avatarUrl").asText();
    }

    private static Path fileOf(String url) {
        return DIR.resolve(url.substring(url.lastIndexOf('/') + 1));
    }

    @Test
    void lesTroisFormatsSontAcceptesEtServisAvecUnLongCache() throws Exception {
        Member awa = register("Awa", "CI");
        String png = avatarUrl(awa, PNG, "moi.png", "image/png");
        assertThat(png).matches("/api/v1/users/" + awa.username() + "/avatar/[0-9a-f-]{36}\\.png");
        mvc.perform(get(png))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(header().string("Cache-Control", containsString("immutable")))
                .andExpect(content().bytes(PNG));
        mvc.perform(get("/api/v1/users/" + awa.username()))
                .andExpect(jsonPath("$.avatarUrl").value(png));

        // Le nom envoyé ne compte pas : seul le contenu décide du format.
        String jpeg = avatarUrl(awa, JPEG, "photo.webp", "image/webp");
        mvc.perform(get(jpeg)).andExpect(content().contentType(MediaType.IMAGE_JPEG));
        String webp = avatarUrl(awa, WEBP, "photo", "application/octet-stream");
        mvc.perform(get(webp)).andExpect(content().contentType("image/webp"));
    }

    @Test
    void unFauxPngOuUnFichierTropLourdEstRefuse() throws Exception {
        Member kofi = register("Kofi", "GH");
        upload(kofi, "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8), "piege.png", "image/png")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PHOTO_TYPE"));
        upload(kofi, "<svg onload=alert(1)>".getBytes(StandardCharsets.UTF_8), "piege.svg", "image/svg+xml")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PHOTO_TYPE"));
        upload(kofi, image(PNG, 2 * 1024 * 1024 + 1), "lourde.png", "image/png")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PHOTO_TOO_LARGE"));
        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/users/me/avatar").with(csrf()).session(kofi.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PHOTO_REQUIRED"));
        mvc.perform(multipart(HttpMethod.PUT, "/api/v1/users/me/avatar")
                        .file(new MockMultipartFile("photo", "a.png", "image/png", PNG)).with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void remplacerOuRetirerLaPhotoEffaceLAncienne() throws Exception {
        Member moussa = register("Moussa", "ML");
        String first = avatarUrl(moussa, PNG, "a.png", "image/png");
        String second = avatarUrl(moussa, JPEG, "b.jpg", "image/jpeg");
        assertThat(second).isNotEqualTo(first);
        mvc.perform(get(first)).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("AVATAR_NOT_FOUND"));
        assertThat(Files.exists(fileOf(first))).isFalse();
        mvc.perform(get(second)).andExpect(status().isOk());

        mvc.perform(delete("/api/v1/users/me/avatar").with(csrf()).session(moussa.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").doesNotExist());
        mvc.perform(get(second)).andExpect(status().isNotFound());
        assertThat(Files.exists(fileOf(second))).isFalse();
        // Un nom inventé ou un chemin détourné ne sert rien.
        mvc.perform(get("/api/v1/users/" + moussa.username() + "/avatar/..%2F..%2Fapplication.yml"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void laPhotoPartAvecLeCompte() throws Exception {
        Member chidi = register("Chidi", "NG");
        String url = avatarUrl(chidi, WEBP, "c.webp", "image/webp");
        assertThat(Files.exists(fileOf(url))).isTrue();
        mvc.perform(delete("/api/v1/users/me").with(csrf()).session(chidi.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("confirmation", chidi.username()))))
                .andExpect(status().isNoContent());
        assertThat(Files.exists(fileOf(url))).isFalse();
    }
}
