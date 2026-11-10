package dev.zetsu.common;

import dev.zetsu.config.CloudinaryProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.TreeMap;

import static dev.zetsu.common.FakeCloudinary.field;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CloudinaryClientTest {

    private FakeCloudinary fake;
    private CloudinaryClient client;

    @BeforeEach
    void start() throws Exception {
        fake = new FakeCloudinary();
        client = new CloudinaryClient(fake.properties());
        client.setClock(Clock.fixed(Instant.ofEpochSecond(1731234567), ZoneOffset.UTC));
    }

    @AfterEach
    void stop() {
        fake.close();
    }

    @Test
    void signatureDeLaDocumentationCloudinary() {
        // Exemple de la page « Authentication signatures » de Cloudinary.
        Map<String, String> params = Map.of("timestamp", "1315060510", "public_id", "sample_image",
                "eager", "w_400,h_300,c_pad|w_260,h_200,c_crop");
        assertThat(CloudinaryClient.sign(params, "abcd")).isEqualTo("bfd09f95f331f558cbd1320e67aa8d488770583e");
    }

    @Test
    void envoiSigneSansJamaisTransmettreLeSecret() {
        CloudinaryClient.Upload up = client.upload("png".getBytes(StandardCharsets.US_ASCII),
                "zetsu/avatars/0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11", "image", CloudinaryClient.PUBLIC);

        assertThat(up.publicId()).isEqualTo("zetsu/avatars/0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11");
        assertThat(up.version()).isEqualTo(1731234567L);
        assertThat(up.format()).isEqualTo("png");
        FakeCloudinary.Request sent = fake.requests().get(0);
        assertThat(sent.path()).isEqualTo("/v1_1/demo/image/upload");
        assertThat(sent.body()).doesNotContain(FakeCloudinary.SECRET);
        assertThat(field(sent.body(), "api_key")).isEqualTo("123456");
        assertThat(field(sent.body(), "timestamp")).isEqualTo("1731234567");
        Map<String, String> signed = new TreeMap<>(Map.of("public_id", field(sent.body(), "public_id"),
                "type", "upload", "overwrite", "false", "timestamp", "1731234567"));
        assertThat(field(sent.body(), "signature")).isEqualTo(CloudinaryClient.sign(signed, FakeCloudinary.SECRET));
    }

    @Test
    void telechargementPriveParUneAdresseSigneeQuiExpire() {
        byte[] content = client.download("zetsu/cv/0b9d6f2e-1c1a-4f7e-9a51-3f3c1d0e2a11.pdf", "raw",
                CloudinaryClient.PRIVATE);

        assertThat(new String(content, StandardCharsets.US_ASCII)).startsWith("%PDF-");
        FakeCloudinary.Request sent = fake.requests().get(0);
        assertThat(sent.method()).isEqualTo("GET");
        assertThat(sent.path()).isEqualTo("/v1_1/demo/raw/download");
        assertThat(sent.query()).contains("type=authenticated").contains("expires_at=1731234627")
                .contains("signature=").doesNotContain(FakeCloudinary.SECRET);
    }

    @Test
    void cloudinaryEnPanneDonneUneErreurClaire() {
        fake.failWith(500);
        assertThatThrownBy(() -> client.upload(new byte[]{1}, "zetsu/avatars/x", "image", CloudinaryClient.PUBLIC))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.code()).isEqualTo("STORAGE_UNAVAILABLE"));
        // La suppression n'échoue jamais : au pire, un fichier orphelin chez Cloudinary.
        client.destroy("zetsu/avatars/x", "image", CloudinaryClient.PUBLIC);
    }

    @Test
    void sansIdentifiantsCloudinaryEstCoupe() {
        CloudinaryClient off = new CloudinaryClient(new CloudinaryProperties(null, null, null, null, null, null));
        assertThat(off.enabled()).isFalse();
    }

    @Test
    void dossierTropLongRefuse() {
        assertThatThrownBy(() -> new CloudinaryProperties("demo", "k", "s", "un-dossier-bien-trop-long", null, null))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
