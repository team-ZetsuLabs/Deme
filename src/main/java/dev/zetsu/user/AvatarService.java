package dev.zetsu.user;

import dev.zetsu.common.ApiException;
import dev.zetsu.user.UserDtos.Me;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

/**
 * Photo de profil (SET-1). avatarUrl vaut {@code /api/v1/users/<pseudo>/avatar/<fichier>} pour une photo
 * téléversée, ou l'adresse fournie par GitHub ou Google. Le nom change à chaque photo : l'image se garde en cache.
 */
@Service
public class AvatarService {

    private static final String PREFIX = "/api/v1/users/";

    public record Image(Resource file, MediaType type) {
    }

    private final UserRepository users;
    private final UserService userService;
    private final AvatarStorage storage;

    public AvatarService(UserRepository users, UserService userService, AvatarStorage storage) {
        this.users = users;
        this.userService = userService;
        this.storage = storage;
    }

    @Transactional
    public Me update(Long userId, MultipartFile photo) {
        User u = users.findById(userId).orElseThrow();
        String previous = storedName(u);
        String name = storage.store(photo);
        // Si la transaction échoue, la nouvelle photo part ; si elle réussit, c'est l'ancienne.
        afterCompletion(previous, name);
        u.setAvatarUrl(PREFIX + u.getUsername() + "/avatar/" + name);
        return userService.toMe(u);
    }

    @Transactional
    public Me delete(Long userId) {
        User u = users.findById(userId).orElseThrow();
        afterCompletion(storedName(u), null);
        u.setAvatarUrl(null);
        return userService.toMe(u);
    }

    /** La photo n'est servie que si c'est bien celle du profil : les anciennes ne restent pas accessibles. */
    @Transactional(readOnly = true)
    public Image load(String username, String file) {
        User u = users.findByUsernameIgnoreCase(username).orElseThrow(AvatarService::notFound);
        if (!storage.isStoredName(file) || !file.equals(storedName(u))) {
            throw notFound();
        }
        return new Image(storage.load(file), storage.mediaType(file));
    }

    /** AUTH-6 : la photo part avec le compte, une fois la suppression validée. */
    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        users.findById(event.userId()).map(this::storedName).ifPresent(name -> afterCompletion(name, null));
    }

    private String storedName(User u) {
        String url = u.getAvatarUrl();
        if (url == null || !url.startsWith(PREFIX)) {
            return null;
        }
        String name = url.substring(url.lastIndexOf('/') + 1);
        return storage.isStoredName(name) ? name : null;
    }

    /** Supprime {@code onCommit} si la transaction est validée, {@code onRollback} sinon. */
    private void afterCompletion(String onCommit, String onRollback) {
        if (onCommit == null && onRollback == null) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                String file = status == STATUS_COMMITTED ? onCommit : onRollback;
                if (file != null) {
                    storage.delete(file);
                }
            }
        });
    }

    private static ApiException notFound() {
        return ApiException.notFound("AVATAR_NOT_FOUND", "Photo introuvable");
    }
}
