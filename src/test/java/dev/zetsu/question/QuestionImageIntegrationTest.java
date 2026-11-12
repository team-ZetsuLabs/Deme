package dev.zetsu.question;

import dev.zetsu.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** QA-11 : deux images au plus par question, vérifiées par leur contenu. */
class QuestionImageIntegrationTest extends IntegrationTest {

    private static final Path DIR = Path.of("target/test-uploads/avatars");
    private static final String BODY = "Mon application Flutter plante au lancement sur un Itel A70 avec l'erreur "
            + "visible sur la capture jointe, alors que tout marche sur l'émulateur.";
    private static final byte[] PNG = image(new byte[]{(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'});
    private static final byte[] JPEG = image(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0});

    @Autowired
    private QuestionImageService images;

    private static byte[] image(byte[] signature) {
        byte[] data = Arrays.copyOf(signature, 2048);
        Arrays.fill(data, signature.length, data.length, (byte) 7);
        return data;
    }

    private ResultActions upload(Member member, byte[] data) throws Exception {
        return mvc.perform(multipart("/api/v1/questions/images")
                .file(new MockMultipartFile("image", "capture.png", "image/png", data))
                .with(csrf()).session(member.session()));
    }

    private String imageId(Member member, byte[] data) throws Exception {
        return read(upload(member, data).andExpect(status().isCreated()).andReturn()).get("id").asText();
    }

    private Map<String, Object> question(List<String> imageIds) {
        Map<String, Object> req = new HashMap<>(Map.of("title", "Flutter plante au lancement sur un Itel A70",
                "body", BODY, "tags", List.of("flutter", "android")));
        if (imageIds != null) {
            req.put("imageIds", imageIds);
        }
        return req;
    }

    private ResultActions ask(Member member, List<String> imageIds) throws Exception {
        return mvc.perform(post("/api/v1/questions").with(csrf()).session(member.session())
                .contentType(MediaType.APPLICATION_JSON).content(body(question(imageIds))));
    }

    @Test
    void deuxImagesJointesPuisRemplacees() throws Exception {
        Member yao = register("Yao", "CI");
        String first = imageId(yao, PNG);
        String second = imageId(yao, JPEG);

        long id = read(ask(yao, List.of(first, second)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.images", hasSize(2)))
                .andExpect(jsonPath("$.images[0].id").value(first))
                .andExpect(jsonPath("$.images[1].id").value(second))
                .andReturn()).get("id").asLong();

        String url = read(mvc.perform(get("/api/v1/questions/{id}", id)).andExpect(status().isOk()).andReturn())
                .get("images").get(0).get("url").asText();
        assertThat(url).matches("/api/v1/questions/images/[0-9a-f-]{36}\\.png");
        mvc.perform(get(url)).andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(PNG));

        // Sans imageIds, les images restent ; avec une liste, elle remplace (l'image retirée est effacée).
        mvc.perform(put("/api/v1/questions/{id}", id).with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(question(null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images", hasSize(2)));
        mvc.perform(put("/api/v1/questions/{id}", id).with(csrf()).session(yao.session())
                        .contentType(MediaType.APPLICATION_JSON).content(body(question(List.of(second)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images", hasSize(1)))
                .andExpect(jsonPath("$.images[0].id").value(second));
        assertThat(Files.exists(DIR.resolve(url.substring(url.lastIndexOf('/') + 1)))).isFalse();
        mvc.perform(get(url)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("IMAGE_NOT_FOUND"));
    }

    @Test
    void troisImagesOuImageDUnAutreSontRefusees() throws Exception {
        Member yao = register("Yao", "CI");
        Member ama = register("Ama", "GH");
        String a = imageId(yao, PNG);
        String b = imageId(yao, PNG);
        String c = imageId(yao, PNG);
        String others = imageId(ama, PNG);

        ask(yao, List.of(a, b, c)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.imageIds").value("2 images maximum"));
        ask(yao, List.of(others)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.imageIds").exists());
        ask(yao, List.of("../../etc/passwd")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.imageIds").exists());

        // Une image déjà rattachée ne sert pas à une seconde question.
        ask(yao, List.of(a)).andExpect(status().isCreated());
        ask(yao, List.of(a)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.imageIds").exists());
    }

    @Test
    void unFauxPngEstRefuseEtLaConnexionExigee() throws Exception {
        Member yao = register("Yao", "CI");
        upload(yao, "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PHOTO_TYPE"));
        upload(yao, Arrays.copyOf(PNG, 2 * 1024 * 1024 + 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PHOTO_TOO_LARGE"));
        mvc.perform(multipart("/api/v1/questions/images")
                        .file(new MockMultipartFile("image", "capture.png", "image/png", PNG)).with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void lesImagesJamaisRattacheesSontEffacees() throws Exception {
        Member yao = register("Yao", "CI");
        String id = imageId(yao, PNG);
        jdbc.update("update question_images set created_at = now() - interval '2 days' where id = ?", id);

        images.purgeOrphans();

        assertThat(jdbc.queryForObject("select count(*) from question_images where id = ?", Integer.class, id))
                .isZero();
    }
}
