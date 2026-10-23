package dev.zetsu.user;

import dev.zetsu.common.ApiException;
import dev.zetsu.config.ZetsuProperties;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
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
 * Photos de profil (SET-1), hors de tout dossier servi au public. Le type est lu dans les premiers octets du
 * fichier, jamais dans son nom ni dans l'en-tête envoyé par le navigateur ; le nom enregistré est régénéré.
 */
@Component
public class AvatarStorage {

    public static final long MAX_BYTES = 2L * 1024 * 1024;
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] RIFF = "RIFF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] WEBP = "WEBP".getBytes(StandardCharsets.US_ASCII);
    private static final Pattern STORED_NAME = Pattern.compile("^[0-9a-f-]{36}\\.(png|jpg|webp)$");

    private final Path dir;

    public AvatarStorage(ZetsuProperties props) {
        this.dir = Path.of(props.uploadsDir(), "avatars").toAbsolutePath().normalize();
    }

    /** Vérifie puis enregistre l'image ; renvoie le nom à garder. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("PHOTO_REQUIRED", "Choisissez une photo");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("PHOTO_TOO_LARGE", "La photo dépasse 2 Mo");
        }
        try {
            byte[] head;
            try (InputStream in = file.getInputStream()) {
                head = in.readNBytes(12);
            }
            String extension = extensionOf(head);
            if (extension == null) {
                throw ApiException.badRequest("PHOTO_TYPE", "La photo doit être au format PNG, JPG ou WebP");
            }
            String name = UUID.randomUUID() + "." + extension;
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(name));
            }
            return name;
        } catch (IOException e) {
            throw new UncheckedIOException("Enregistrement de la photo impossible", e);
        }
    }

    public boolean isStoredName(String name) {
        return name != null && STORED_NAME.matcher(name).matches();
    }

    public Resource load(String name) {
        return new PathResource(resolve(name));
    }

    public MediaType mediaType(String name) {
        if (name.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        return name.endsWith(".jpg") ? MediaType.IMAGE_JPEG : MediaType.parseMediaType("image/webp");
    }

    public void delete(String name) {
        try {
            Files.deleteIfExists(resolve(name));
        } catch (IOException e) {
            throw new UncheckedIOException("Suppression de la photo impossible", e);
        }
    }

    private Path resolve(String name) {
        if (!isStoredName(name)) {
            throw new IllegalArgumentException("Nom de photo inattendu");
        }
        return dir.resolve(name);
    }

    private static String extensionOf(byte[] head) {
        if (startsWith(head, PNG, 0)) {
            return "png";
        }
        if (startsWith(head, JPEG, 0)) {
            return "jpg";
        }
        if (startsWith(head, RIFF, 0) && startsWith(head, WEBP, 8)) {
            return "webp";
        }
        return null;
    }

    private static boolean startsWith(byte[] data, byte[] prefix, int offset) {
        return data.length >= offset + prefix.length
                && Arrays.equals(data, offset, offset + prefix.length, prefix, 0, prefix.length);
    }
}
