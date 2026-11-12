package dev.zetsu.question;

import dev.zetsu.common.ApiException;
import dev.zetsu.question.QuestionDtos.QuestionImageView;
import dev.zetsu.user.AvatarStorage;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Images jointes aux questions (QA-11). Le membre envoie chaque image d'abord ({@link #upload}), puis la question
 * cite leurs identifiants dans imageIds. Une image ne sert qu'à une question ; celles jamais rattachées partent au
 * bout d'un jour.
 */
@Service
public class QuestionImageService {

    public static final int MAX_PER_QUESTION = 2;
    private static final Duration ORPHAN_TTL = Duration.ofDays(1);
    private static final Pattern UUID = Pattern.compile("([0-9a-f-]{36})(\\.[a-z]+)?$");

    public record Image(Resource file, MediaType type) {
    }

    private final QuestionImageRepository images;
    private final AvatarStorage storage;

    public QuestionImageService(QuestionImageRepository images, AvatarStorage storage) {
        this.images = images;
        this.storage = storage;
    }

    @Transactional
    public QuestionImageView upload(MultipartFile file, Long uploaderId) {
        AvatarStorage.Stored stored = storage.storeQuestionImage(file);
        Matcher m = UUID.matcher(stored.ref());
        if (!m.find()) {
            throw new IllegalStateException("Référence d'image inattendue : " + stored.ref());
        }
        // Si l'enregistrement échoue, le fichier ne reste pas sans propriétaire.
        afterCompletion(null, stored.ref());
        QuestionImage image = images.saveAndFlush(new QuestionImage(m.group(1), uploaderId, stored.ref(),
                stored.url()));
        return view(image);
    }

    /**
     * Rattache les images citées à la question, dans l'ordre donné, et efface celles qui n'y sont plus.
     * {@code ids} null : rien ne change. Une image citée doit être déjà sur cette question, ou envoyée par ce
     * membre et encore libre.
     */
    @Transactional
    public void attach(Long questionId, List<String> ids, Long memberId) {
        if (ids == null) {
            return;
        }
        Set<String> wanted = new LinkedHashSet<>(ids);
        if (wanted.size() > MAX_PER_QUESTION) {
            throw ApiException.invalidField("imageIds", MAX_PER_QUESTION + " images maximum");
        }
        List<QuestionImage> chosen = new ArrayList<>();
        for (String id : wanted) {
            QuestionImage image = id == null ? null : images.findById(id).orElse(null);
            boolean usable = image != null && (questionId.equals(image.getQuestionId())
                    || (image.getQuestionId() == null && image.getUploaderId().equals(memberId)));
            if (!usable) {
                throw ApiException.invalidField("imageIds", "Image introuvable, envoyez-la de nouveau");
            }
            chosen.add(image);
        }
        for (QuestionImage old : images.findByQuestionIdOrderByPositionAsc(questionId)) {
            if (!wanted.contains(old.getId())) {
                images.delete(old);
                afterCompletion(old.getStorageRef(), null);
            }
        }
        for (int i = 0; i < chosen.size(); i++) {
            chosen.get(i).attach(questionId, i);
        }
        images.flush();
    }

    @Transactional(readOnly = true)
    public List<QuestionImageView> of(Long questionId) {
        return images.findByQuestionIdOrderByPositionAsc(questionId).stream().map(QuestionImageService::view)
                .toList();
    }

    /** Image gardée sur le disque du serveur (sans Cloudinary) ; 404 pour tout autre nom. */
    @Transactional(readOnly = true)
    public Image load(String file) {
        if (!storage.isStoredName(file) || images.findByStorageRef(file).isEmpty()) {
            throw ApiException.notFound("IMAGE_NOT_FOUND", "Image introuvable");
        }
        return new Image(storage.load(file), storage.mediaType(file));
    }

    @Scheduled(fixedDelay = 1, timeUnit = TimeUnit.HOURS)
    @Transactional
    public void purgeOrphans() {
        for (QuestionImage orphan : images.findOrphansBefore(Instant.now().minus(ORPHAN_TTL))) {
            images.delete(orphan);
            afterCompletion(orphan.getStorageRef(), null);
        }
    }

    private static QuestionImageView view(QuestionImage image) {
        return new QuestionImageView(image.getId(), image.getUrl());
    }

    /** Efface le fichier {@code onCommit} si la transaction est validée, {@code onRollback} sinon. */
    private void afterCompletion(String onCommit, String onRollback) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                String ref = status == STATUS_COMMITTED ? onCommit : onRollback;
                if (ref != null) {
                    storage.delete(ref);
                }
            }
        });
    }
}
