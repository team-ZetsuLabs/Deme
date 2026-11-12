package dev.zetsu.user;

import dev.zetsu.common.ApiException;
import dev.zetsu.common.CloudinaryClient;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Photos de profil (SET-1). Le type est lu dans les premiers octets du fichier, jamais dans son nom ni dans
 * l'en-tête envoyé par le navigateur ; le nom enregistré est régénéré.
 * <p>
 * Avec Cloudinary configuré, la photo part sur son CDN et avatarUrl pointe vers une version recadrée en 256 px,
 * au format le plus léger que le navigateur sait lire. Sinon elle reste sur le disque, hors de tout dossier public,
 * et le serveur la sert lui-même. Les photos déjà sur le disque restent servies après le passage à Cloudinary.
 */
@Component
public class AvatarStorage {

    public static final long MAX_BYTES = 2L * 1024 * 1024;
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] RIFF = "RIFF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] WEBP = "WEBP".getBytes(StandardCharsets.US_ASCII);
    private static final Pattern STORED_NAME = Pattern.compile("^[0-9a-f-]{36}\\.(png|jpg|webp)$");
    /** Recadrage carré et format automatique (WebP, AVIF…) : quelques Ko par photo, pour la 3G. */
    static final String TRANSFORMATION = "c_fill,w_256,h_256/f_auto,q_auto";
    private static final String LOCAL_PREFIX = "/api/v1/users/";
    private static final String ICON_PREFIX = "/api/v1/playtests/";
    private static final String ICONS = "playtests";
    static final String ICON_TRANSFORMATION = "c_fill,w_128,h_128/f_auto,q_auto";
    private static final String QUESTION_IMAGES = "questions";
    private static final String QUESTION_IMAGE_PREFIX = "/api/v1/questions/images/";
    /** Largeur limitée, sans agrandir ni recadrer, au format le plus léger pour la 3G. */
    static final String QUESTION_IMAGE_TRANSFORMATION = "c_limit,w_1280/f_auto,q_auto";
    private static final String CLOUD = "cloudinary:";
    private static final Pattern CLOUD_ID = Pattern.compile("/v\\d+/(.+)/([0-9a-f-]{36})\\.[a-z0-9]+$");

    /** Photo enregistrée : {@code ref} sert à la supprimer, {@code url} va dans avatarUrl. */
    public record Stored(String ref, String url) {
    }

    private final Path dir;
    private final CloudinaryClient cloudinary;

    public AvatarStorage(ZetsuProperties props, CloudinaryClient cloudinary) {
        this.dir = Path.of(props.uploadsDir(), "avatars").toAbsolutePath().normalize();
        this.cloudinary = cloudinary;
    }

    /** Vérifie puis enregistre l'image, chez Cloudinary s'il est configuré, sinon sur le disque. */
    public Stored store(MultipartFile file, String username) {
        String name = check(file);
        if (cloudinary.enabled()) {
            String publicId = cloudinary.folder("avatars") + "/" + name.substring(0, name.indexOf('.'));
            CloudinaryClient.Upload up = cloudinary.upload(bytes(file), publicId, "image", CloudinaryClient.PUBLIC);
            String extension = up.format() == null ? name.substring(name.indexOf('.') + 1) : up.format();
            return new Stored(CLOUD + up.publicId(), cloudPrefix() + TRANSFORMATION + "/v" + up.version() + "/"
                    + up.publicId() + "." + extension);
        }
        writeLocal(file, name);
        return new Stored(name, LOCAL_PREFIX + username + "/avatar/" + name);
    }

    /** Icône d'une campagne de test fermé (TST-1) : mêmes contrôles qu'une photo, recadrée en 128 px. */
    public Stored storeIcon(MultipartFile file, Long campaignId) {
        String name = check(file);
        if (cloudinary.enabled()) {
            String publicId = cloudinary.folder(ICONS) + "/" + name.substring(0, name.indexOf('.'));
            CloudinaryClient.Upload up = cloudinary.upload(bytes(file), publicId, "image", CloudinaryClient.PUBLIC);
            String extension = up.format() == null ? name.substring(name.indexOf('.') + 1) : up.format();
            return new Stored(CLOUD + up.publicId(), cloudPrefix() + ICON_TRANSFORMATION + "/v" + up.version() + "/"
                    + up.publicId() + "." + extension);
        }
        writeLocal(file, name);
        return new Stored(name, ICON_PREFIX + campaignId + "/icon/" + name);
    }

    /**
     * Image jointe à une question (QA-11) : mêmes contrôles qu'une photo, sans recadrage, réduite à 1280 px de large
     * au plus. Sur le disque, servie par {@code GET /api/v1/questions/images/<fichier>}.
     */
    public Stored storeQuestionImage(MultipartFile file) {
        String name = check(file);
        if (cloudinary.enabled()) {
            String publicId = cloudinary.folder(QUESTION_IMAGES) + "/" + name.substring(0, name.indexOf('.'));
            CloudinaryClient.Upload up = cloudinary.upload(bytes(file), publicId, "image", CloudinaryClient.PUBLIC);
            String extension = up.format() == null ? name.substring(name.indexOf('.') + 1) : up.format();
            return new Stored(CLOUD + up.publicId(), cloudPrefix() + QUESTION_IMAGE_TRANSFORMATION + "/v"
                    + up.version() + "/" + up.publicId() + "." + extension);
        }
        writeLocal(file, name);
        return new Stored(name, QUESTION_IMAGE_PREFIX + name);
    }

    /** Référence d'une icône enregistrée par Zetsu, null pour toute autre adresse. */
    public String iconRefOf(String iconUrl) {
        if (iconUrl == null) {
            return null;
        }
        if (iconUrl.startsWith(ICON_PREFIX)) {
            String name = iconUrl.substring(iconUrl.lastIndexOf('/') + 1);
            return isStoredName(name) ? name : null;
        }
        if (cloudinary.enabled() && iconUrl.startsWith(cloudPrefix())) {
            Matcher m = CLOUD_ID.matcher(iconUrl);
            if (m.find() && m.group(1).equals(cloudinary.folder(ICONS))) {
                return CLOUD + m.group(1) + "/" + m.group(2);
            }
        }
        return null;
    }

    /**
     * Retrouve la référence d'une photo enregistrée par Zetsu à partir d'avatarUrl ; null pour une photo venue de
     * GitHub ou Google, ou pour une adresse qui ne vient pas de nous.
     */
    public String refOf(String avatarUrl) {
        if (avatarUrl == null) {
            return null;
        }
        if (avatarUrl.startsWith(LOCAL_PREFIX)) {
            String name = avatarUrl.substring(avatarUrl.lastIndexOf('/') + 1);
            return isStoredName(name) ? name : null;
        }
        if (cloudinary.enabled() && avatarUrl.startsWith(cloudPrefix())) {
            Matcher m = CLOUD_ID.matcher(avatarUrl);
            if (m.find() && m.group(1).equals(cloudinary.folder("avatars"))) {
                return CLOUD + m.group(1) + "/" + m.group(2);
            }
        }
        return null;
    }

    private String cloudPrefix() {
        return "https://res.cloudinary.com/" + cloudinary.cloudName() + "/image/upload/";
    }

    private static byte[] bytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Lecture de la photo impossible", e);
        }
    }

    /** Vérifie taille et type réel ; renvoie un nom régénéré avec la bonne extension. */
    private static String check(MultipartFile file) {
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
            return UUID.randomUUID() + "." + extension;
        } catch (IOException e) {
            throw new UncheckedIOException("Lecture de la photo impossible", e);
        }
    }

    private void writeLocal(MultipartFile file, String name) {
        try {
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(name));
            }
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

    /** Supprime une photo à partir de sa référence ({@link #refOf}). */
    public void delete(String ref) {
        if (ref.startsWith(CLOUD)) {
            cloudinary.destroy(ref.substring(CLOUD.length()), "image", CloudinaryClient.PUBLIC);
            return;
        }
        try {
            Files.deleteIfExists(resolve(ref));
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
