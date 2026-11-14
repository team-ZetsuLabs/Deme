package dev.zetsu.job;

import dev.zetsu.common.ApiException;
import dev.zetsu.common.CloudinaryClient;
import dev.zetsu.config.ZetsuProperties;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * CV des candidatures (JOB-3), hors du dossier public : type réel vérifié par la signature du fichier (pas par
 * son nom ni par l'en-tête envoyé), 2 Mo maximum, nom régénéré.
 * <p>
 * Avec Cloudinary configuré, le CV y est rangé en fichier privé : aucune adresse publique, seul le serveur le relit
 * (requête signée) pour le recruteur, après les mêmes contrôles d'accès. Sinon il reste sur le disque. La référence
 * gardée en base distingue les deux, et les CV déjà sur le disque restent lisibles.
 */
@Component
public class CvStorage {

    public static final long MAX_BYTES = 2L * 1024 * 1024;
    private static final byte[] PDF_SIGNATURE = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final Pattern STORED_NAME = Pattern.compile("^[0-9a-f-]{36}\\.pdf$");
    /**
     * Référence d'un CV chez Cloudinary : {@code cld:<dossier>/cv/<uuid>.pdf}. La colonne cv_file fait 60
     * caractères : le dossier en garde 12 au plus (voir {@link dev.zetsu.config.CloudinaryProperties}).
     */
    private static final String CLOUD = "cld:";
    private static final Pattern CLOUD_ID = Pattern.compile("^[a-z0-9_-]{1,12}/cv/[0-9a-f-]{36}\\.pdf$");

    private final Path dir;
    private final CloudinaryClient cloudinary;

    public CvStorage(ZetsuProperties props, CloudinaryClient cloudinary) {
        this.dir = Path.of(props.uploadsDir(), "cv").toAbsolutePath().normalize();
        this.cloudinary = cloudinary;
    }

    /** Vérifie puis enregistre le fichier ; renvoie le nom à garder en base. */
    public String store(MultipartFile file) {
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("CV_TOO_LARGE", "Le CV dépasse 2 Mo");
        }
        try {
            byte[] head;
            try (InputStream in = file.getInputStream()) {
                head = in.readNBytes(PDF_SIGNATURE.length);
            }
            if (!Arrays.equals(head, PDF_SIGNATURE)) {
                throw ApiException.badRequest("CV_NOT_PDF", "Le CV doit être un fichier PDF");
            }
            String name = UUID.randomUUID() + ".pdf";
            if (cloudinary.enabled()) {
                // En « raw », l'identifiant garde l'extension : le fichier relu reste un .pdf.
                CloudinaryClient.Upload up = cloudinary.upload(file.getBytes(), cloudinary.folder("cv") + "/" + name,
                        "raw", CloudinaryClient.PRIVATE);
                return CLOUD + up.publicId();
            }
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(name));
            }
            return name;
        } catch (IOException e) {
            throw new UncheckedIOException("Enregistrement du CV impossible", e);
        }
    }

    public Resource load(String name) {
        if (name.startsWith(CLOUD)) {
            return new ByteArrayResource(cloudinary.download(cloudId(name), "raw", CloudinaryClient.PRIVATE));
        }
        return new PathResource(resolve(name));
    }

    public void delete(String name) {
        if (name.startsWith(CLOUD)) {
            cloudinary.destroy(cloudId(name), "raw", CloudinaryClient.PRIVATE);
            return;
        }
        try {
            Files.deleteIfExists(resolve(name));
        } catch (IOException e) {
            throw new UncheckedIOException("Suppression du CV impossible", e);
        }
    }

    private static String cloudId(String ref) {
        String id = ref.substring(CLOUD.length());
        if (!CLOUD_ID.matcher(id).matches()) {
            throw new IllegalArgumentException("Référence de CV inattendue");
        }
        return id;
    }

    private Path resolve(String name) {
        if (name == null || !STORED_NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("Nom de CV inattendu");
        }
        return dir.resolve(name);
    }
}
