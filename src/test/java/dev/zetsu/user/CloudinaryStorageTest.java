package dev.zetsu.user;

import dev.zetsu.common.CloudinaryClient;
import dev.zetsu.common.FakeCloudinary;
import dev.zetsu.config.ZetsuProperties;
import dev.zetsu.job.CvStorage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static dev.zetsu.common.FakeCloudinary.field;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Photos et CV quand Cloudinary est configuré : rien n'est écrit sur le disque du serveur. */
class CloudinaryStorageTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n', 0, 0, 0, 0};

    @TempDir
    Path uploads;

    private FakeCloudinary fake;
    private AvatarStorage avatars;
    private CvStorage cvs;

    @BeforeEach
    void start() throws Exception {
        fake = new FakeCloudinary();
        CloudinaryClient client = new CloudinaryClient(fake.properties());
        ZetsuProperties props = new ZetsuProperties("/", false, uploads.toString());
        avatars = new AvatarStorage(props, client);
        cvs = new CvStorage(props, client);
    }

    @AfterEach
    void stop() {
        fake.close();
    }

    @Test
    void photoPubliqueRecadreeSurLeCdn() throws Exception {
        AvatarStorage.Stored stored = avatars.store(
                new MockMultipartFile("photo", "../../moi.exe", "text/html", PNG), "aminata_dev");

        assertThat(stored.url()).matches("https://res\\.cloudinary\\.com/demo/image/upload/"
                + "c_fill,w_256,h_256/f_auto,q_auto/v1731234567/zetsu/avatars/[0-9a-f-]{36}\\.png");
        FakeCloudinary.Request sent = fake.requests().get(0);
        assertThat(sent.path()).isEqualTo("/v1_1/demo/image/upload");
        assertThat(field(sent.body(), "type")).isEqualTo("upload");
        assertThat(field(sent.body(), "public_id")).doesNotContain("moi");
        assertThat(Files.exists(uploads.resolve("avatars"))).isFalse();

        // La référence se retrouve depuis avatarUrl, et sert à supprimer la photo chez Cloudinary.
        String ref = avatars.refOf(stored.url());
        assertThat(ref).isEqualTo(stored.ref());
        avatars.delete(ref);
        FakeCloudinary.Request destroy = fake.requests().get(1);
        assertThat(destroy.path()).isEqualTo("/v1_1/demo/image/destroy");
        assertThat(field(destroy.body(), "public_id")).isEqualTo(field(sent.body(), "public_id"));
    }

    @Test
    void lesAdressesQuiNeViennentPasDeNousNeSontJamaisSupprimees() {
        assertThat(avatars.refOf("https://avatars.githubusercontent.com/u/123")).isNull();
        assertThat(avatars.refOf("https://res.cloudinary.com/autre-compte/image/upload/v1/zetsu/avatars/"
                + "0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11.png")).isNull();
        assertThat(avatars.refOf("https://res.cloudinary.com/demo/image/upload/v1/autre-dossier/avatars/"
                + "0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11.png")).isNull();
        // Un avatar de démo posé par seed/photos-cloudinary.sql est reconnu, donc retiré si le membre en change.
        assertThat(avatars.refOf("https://res.cloudinary.com/demo/image/upload/c_fill,w_256,h_256/f_auto,q_auto/v1/"
                + "zetsu/avatars/d5d75ee1-0550-5f0a-a590-fbb182e1a12f.webp"))
                .isEqualTo("cloudinary:zetsu/avatars/d5d75ee1-0550-5f0a-a590-fbb182e1a12f");
        // Une photo restée sur le disque avant le passage à Cloudinary reste reconnue.
        assertThat(avatars.refOf("/api/v1/users/awa/avatar/0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11.png"))
                .isEqualTo("0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11.png");
    }

    @Test
    void cvPriveReluParLeServeurSeulement() throws Exception {
        String ref = cvs.store(new MockMultipartFile("cv", "cv.pdf", "application/pdf",
                "%PDF-1.4 mon cv".getBytes(StandardCharsets.US_ASCII)));

        assertThat(ref).matches("cld:zetsu/cv/[0-9a-f-]{36}\\.pdf").hasSizeLessThanOrEqualTo(60);
        FakeCloudinary.Request sent = fake.requests().get(0);
        assertThat(sent.path()).isEqualTo("/v1_1/demo/raw/upload");
        assertThat(field(sent.body(), "type")).isEqualTo("authenticated");
        assertThat(Files.exists(uploads.resolve("cv"))).isFalse();

        assertThat(new String(cvs.load(ref).getContentAsByteArray(), StandardCharsets.US_ASCII)).startsWith("%PDF-");
        cvs.delete(ref);
        assertThat(fake.requests().get(2).path()).isEqualTo("/v1_1/demo/raw/destroy");

        assertThatThrownBy(() -> cvs.load("cld:../../etc/passwd")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void leTypeReelResteVerifieAvantLEnvoi() {
        assertThatThrownBy(() -> cvs.store(new MockMultipartFile("cv", "cv.pdf", "application/pdf",
                "<script>alert(1)</script>".getBytes(StandardCharsets.US_ASCII))))
                .hasMessageContaining("PDF");
        assertThat(fake.requests()).isEmpty();
    }
}
