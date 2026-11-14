package dev.zetsu.common;

import com.fasterxml.jackson.databind.JsonNode;
import dev.zetsu.config.CloudinaryProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Appels signés à l'API REST de Cloudinary (envoi, suppression, téléchargement d'un fichier privé), sans SDK.
 * Le secret ne sert qu'à signer côté serveur : il n'apparaît dans aucune requête ni aucune réponse.
 */
@Component
public class CloudinaryClient {

    /** Fichier public, servi par le CDN de Cloudinary (photos de profil). */
    public static final String PUBLIC = "upload";
    /** Fichier privé : seul le serveur peut le relire, avec une requête signée (CV). */
    public static final String PRIVATE = "authenticated";

    public record Upload(String publicId, String secureUrl, long version, String format) {
    }

    private static final Logger log = LoggerFactory.getLogger(CloudinaryClient.class);

    private final CloudinaryProperties props;
    private final RestClient http;
    private Clock clock = Clock.systemUTC();

    public CloudinaryClient(CloudinaryProperties props) {
        this.props = props;
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(props.timeout())
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(client);
        factory.setReadTimeout(props.timeout());
        this.http = RestClient.builder().requestFactory(factory).build();
    }

    void setClock(Clock clock) {
        this.clock = clock;
    }

    public boolean enabled() {
        return props.configured();
    }

    public String cloudName() {
        return props.cloudName();
    }

    /** Dossier racine suivi d'un sous-dossier : {@code zetsu/avatars}. */
    public String folder(String sub) {
        return props.folder() + "/" + sub;
    }

    /**
     * Envoie un fichier sous un identifiant choisi par le serveur (jamais le nom donné par le navigateur).
     *
     * @param resourceType {@code image} ou {@code raw}
     * @param type         {@link #PUBLIC} ou {@link #PRIVATE}
     */
    public Upload upload(byte[] content, String publicId, String resourceType, String type) {
        Map<String, String> params = signed(Map.of("public_id", publicId, "type", type, "overwrite", "false"));
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        params.forEach(form::add);
        form.add("file", new ByteArrayResource(content) {
            @Override
            public String getFilename() {
                return "file";
            }
        });
        JsonNode body = call(() -> http.post().uri(endpoint(resourceType, "upload"))
                .contentType(MediaType.MULTIPART_FORM_DATA).body(form).retrieve().body(JsonNode.class));
        if (body == null || !body.hasNonNull("secure_url") || !body.hasNonNull("public_id")) {
            throw unavailable("réponse d'envoi incomplète");
        }
        return new Upload(body.get("public_id").asText(), body.get("secure_url").asText(),
                body.path("version").asLong(), body.path("format").asText(null));
    }

    /** Supprime un fichier ; un fichier déjà absent n'est pas une erreur. Un échec est journalisé, pas propagé. */
    public void destroy(String publicId, String resourceType, String type) {
        try {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            signed(Map.of("public_id", publicId, "type", type, "invalidate", "true")).forEach(form::add);
            http.post().uri(endpoint(resourceType, "destroy")).contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(form).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("Suppression Cloudinary de {} impossible : {}", publicId, e.getMessage());
        }
    }

    /** Relit un fichier privé avec une adresse de téléchargement signée et valable une minute. */
    public byte[] download(String publicId, String resourceType, String type) {
        long expiresAt = clock.instant().getEpochSecond() + 60;
        Map<String, String> params = signed(Map.of("public_id", publicId, "type", type,
                "expires_at", Long.toString(expiresAt)));
        UriComponentsBuilder uri = UriComponentsBuilder.fromUri(endpoint(resourceType, "download"));
        params.forEach(uri::queryParam);
        byte[] content = call(() -> http.get().uri(uri.encode().build().toUri()).retrieve().body(byte[].class));
        if (content == null) {
            throw unavailable("fichier vide");
        }
        return content;
    }

    /**
     * Signature des appels à l'API : paramètres triés par nom, {@code nom=valeur} joints par {@code &}, suivis du
     * secret, en SHA-1 hexadécimal. {@code file}, {@code api_key}, {@code resource_type} et {@code cloud_name}
     * n'entrent pas dans la signature.
     */
    public static String sign(Map<String, String> params, String apiSecret) {
        String toSign = new TreeMap<>(params).entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1")
                    .digest((toSign + apiSecret).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private Map<String, String> signed(Map<String, String> params) {
        Map<String, String> all = new TreeMap<>(params);
        all.put("timestamp", Long.toString(clock.instant().getEpochSecond()));
        all.put("signature", sign(all, props.apiSecret()));
        all.put("api_key", props.apiKey());
        return all;
    }

    private URI endpoint(String resourceType, String action) {
        if (!enabled()) {
            throw new IllegalStateException("Cloudinary n'est pas configuré");
        }
        return URI.create(props.apiBase() + "/v1_1/" + props.cloudName() + "/" + resourceType + "/" + action);
    }

    private <T> T call(java.util.function.Supplier<T> request) {
        try {
            return request.get();
        } catch (RestClientException e) {
            throw unavailable(e.getMessage());
        }
    }

    private static ApiException unavailable(String reason) {
        log.warn("Cloudinary indisponible : {}", reason);
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "STORAGE_UNAVAILABLE",
                "Le stockage des fichiers est momentanément indisponible, réessayez dans un instant");
    }
}
