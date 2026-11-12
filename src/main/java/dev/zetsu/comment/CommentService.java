package dev.zetsu.comment;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.comment.CommentDtos.CommentView;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * QA-9. Ce service ne dépend ni des questions ni des réponses, qui le lisent pour remplir leurs vues : la visibilité
 * de la cible est vérifiée par {@link CommentController} avant d'écrire.
 */
@Service
public class CommentService {

    private final CommentRepository comments;
    private final UserRepository users;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;

    public CommentService(CommentRepository comments, UserRepository users, MarkdownRenderer markdown,
                          ReputationService reputation) {
        this.comments = comments;
        this.users = users;
        this.markdown = markdown;
        this.reputation = reputation;
    }

    @Transactional(readOnly = true)
    public List<CommentView> forQuestion(Long questionId, ZetsuPrincipal me) {
        return comments.findForQuestion(questionId).stream().map(c -> toView(c, me)).toList();
    }

    /** Commentaires de plusieurs réponses en une seule requête, rangés par réponse (liste vide si aucun). */
    @Transactional(readOnly = true)
    public Map<Long, List<CommentView>> forAnswers(Collection<Long> answerIds, ZetsuPrincipal me) {
        Map<Long, List<CommentView>> byAnswer = new LinkedHashMap<>();
        answerIds.forEach(id -> byAnswer.put(id, new ArrayList<>()));
        if (!answerIds.isEmpty()) {
            for (Comment c : comments.findForAnswers(answerIds)) {
                byAnswer.get(c.getAnswerId()).add(toView(c, me));
            }
        }
        return byAnswer;
    }

    @Transactional
    public CommentView addToQuestion(Long questionId, String body, ZetsuPrincipal me) {
        String text = body.strip();
        return save(Comment.onQuestion(questionId, users.getReferenceById(me.id()), text, markdown.toSafeHtml(text)),
                me);
    }

    @Transactional
    public CommentView addToAnswer(Long answerId, String body, ZetsuPrincipal me) {
        String text = body.strip();
        return save(Comment.onAnswer(answerId, users.getReferenceById(me.id()), text, markdown.toSafeHtml(text)), me);
    }

    @Transactional
    public void delete(Long id, ZetsuPrincipal me) {
        Comment c = comments.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("COMMENT_NOT_FOUND", "Commentaire introuvable"));
        if (!canDelete(c, me)) {
            throw ApiException.forbidden("NOT_COMMENT_AUTHOR", "Seul l'auteur peut supprimer ce commentaire");
        }
        comments.delete(c);
    }

    private CommentView save(Comment c, ZetsuPrincipal me) {
        comments.saveAndFlush(c);
        return toView(comments.findDetailed(c.getId()).orElseThrow(), me);
    }

    private static boolean canDelete(Comment c, ZetsuPrincipal me) {
        return me != null && (c.getAuthor().getId().equals(me.id()) || me.staff());
    }

    private CommentView toView(Comment c, ZetsuPrincipal me) {
        return new CommentView(c.getId(),
                AuthorSummary.from(c.getAuthor(), reputation.levelOf(c.getAuthor().getReputation())),
                c.getBodyHtml(), c.getCreatedAt(), canDelete(c, me));
    }
}
