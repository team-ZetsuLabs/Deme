package dev.zetsu.job;

import dev.zetsu.common.ApiException;
import dev.zetsu.config.ZetsuProperties;
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
 */
@Component
public class CvStorage {

    public static final long MAX_BYTES = 2L * 1024 * 1024;
    private static final byte[] PDF_SIGNATURE = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final Pattern STORED_NAME = Pattern.compile("^[0-9a-f-]{36}\\.pdf$");

    private final Path dir;

    public CvStorage(ZetsuProperties props) {
        this.dir = Path.of(props.uploadsDir(), "cv").toAbsolutePath().normalize();
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
        return new PathResource(resolve(name));
    }

    public void delete(String name) {
        try {
            Files.deleteIfExists(resolve(name));
        } catch (IOException e) {
            throw new UncheckedIOException("Suppression du CV impossible", e);
        }
    }

    private Path resolve(String name) {
        if (name == null || !STORED_NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("Nom de CV inattendu");
        }
        return dir.resolve(name);
    }
}
