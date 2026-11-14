package dev.zetsu.user;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.concurrent.ThreadLocalRandom;

/** Fabrique un pseudo libre à partir d'un login externe : « Kofi Mensah » devient {@code kofi_mensah}. */
@Component
public class UsernameGenerator {

    private final UserRepository users;

    public UsernameGenerator(UserRepository users) {
        this.users = users;
    }

    public String available(String hint) {
        String base = normalize(hint);
        if (!users.existsByUsernameIgnoreCase(base)) {
            return base;
        }
        for (int i = 0; i < 20; i++) {
            String candidate = trim(base, 25) + "_" + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (!users.existsByUsernameIgnoreCase(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Impossible de trouver un pseudo libre pour " + base);
    }

    static String normalize(String hint) {
        String s = hint == null ? "" : Normalizer.normalize(hint, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9_]+", "_")
                .replaceAll("^_+|_+$", "");
        if (s.length() < 3) {
            s = "membre" + (s.isEmpty() ? "" : "_" + s);
        }
        return trim(s, 30);
    }

    private static String trim(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
