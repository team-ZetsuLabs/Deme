package dev.zetsu.answer;

import dev.zetsu.answer.AnswerDtos.AnswerView;
import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.question.Question;
import dev.zetsu.question.QuestionDtos.QuestionDetail;
import dev.zetsu.question.QuestionRepository;
import dev.zetsu.question.QuestionService;
import dev.zetsu.reputation.BadgeService;
import dev.zetsu.reputation.ReputationReason;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.Role;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import dev.zetsu.vote.Vote;
import dev.zetsu.vote.VoteRepository;
import dev.zetsu.vote.VoteTarget;
import org.springframework.data.domain.Page;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnswerService {

    private final AnswerRepository answers;
    private final QuestionRepository questions;
    private final QuestionService questionService;
    private final UserRepository users;
    private final VoteRepository votes;
    private final ReputationService reputation;
    private final MarkdownRenderer markdown;
    private final NotificationService notifications;
    private final BadgeService badges;

    public AnswerService(AnswerRepository answers, QuestionRepository questions, QuestionService questionService,
                         UserRepository users, VoteRepository votes, ReputationService reputation,
                         MarkdownRenderer markdown, NotificationService notifications, BadgeService badges) {
        this.answers = answers;
        this.questions = questions;
        this.questionService = questionService;
        this.users = users;
        this.votes = votes;
        this.reputation = reputation;
        this.markdown = markdown;
        this.notifications = notifications;
        this.badges = badges;
    }

    @Transactional(readOnly = true)
    public PageResponse<AnswerView> list(Long questionId, int page, int size, ZetsuPrincipal me) {
        Question q = questionService.loadVisible(questionId, me);
        Page<Answer> result = answers.findForQuestion(questionId, q.getAcceptedAnswerId(),
                me == null ? null : me.id(), me != null && me.staff(), Paging.of(page, size));
        Map<Long, Integer> myVotes = myVotes(result.getContent(), me);
        return PageResponse.of(result, a -> toView(a, q, myVotes.get(a.getId()), me));
    }

    @Transactional
    public AnswerView create(Long questionId, AnswerDtos.AnswerRequest req, ZetsuPrincipal me) {
        Question q = questionService.loadVisible(questionId, me);
        Answer a = new Answer(q.getId(), users.getReferenceById(me.id()));
        a.setBody(req.body(), markdown.toSafeHtml(req.body()));
        a.setCode(blankToNull(req.code()));
        answers.saveAndFlush(a);
        if (questions.addAnswerCount(q.getId(), 1) == 0) {
            // Supprimée entre la lecture et l'écriture : la transaction est annulée, la réponse avec.
            throw ApiException.notFound("QUESTION_NOT_FOUND", "Question introuvable");
        }
        notifications.notify(q.getAuthor().getId(), NotificationType.ANSWER_POSTED, me.id(),
                NotificationService.answer(a.getId(), q.getTitle(), q.getId()), null);
        // Une réponse ne rapporte pas de points mais compte pour Premier pas, Entraide et Aide locale (REP-4).
        badges.refresh(me.id());
        return toView(a, q, null, me);
    }

    @Transactional
    public AnswerView update(Long answerId, AnswerDtos.AnswerRequest req, ZetsuPrincipal me) {
        Answer a = load(answerId);
        if (!canEdit(a, me)) {
            throw ApiException.forbidden("NOT_ANSWER_AUTHOR", "Seul l'auteur peut modifier cette réponse");
        }
        a.setBody(req.body(), markdown.toSafeHtml(req.body()));
        a.setCode(blankToNull(req.code()));
        a.touch();
        answers.saveAndFlush(a);
        Question q = questionService.load(a.getQuestionId());
        Integer myVote = votes.findByVoterIdAndTargetTypeAndTargetId(me.id(), VoteTarget.ANSWER, a.getId())
                .map(Vote::getValue).orElse(null);
        return toView(a, q, myVote, me);
    }

    /** L'auteur de la question choisit la réponse qui l'a aidé. {@code answerId} null retire l'acceptation. */
    @Transactional
    public QuestionDetail accept(Long questionId, Long answerId, ZetsuPrincipal me) {
        Question q = questionService.load(questionId);
        Long questionAuthorId = q.getAuthor().getId();
        if (!questionAuthorId.equals(me.id())) {
            throw ApiException.forbidden("NOT_QUESTION_AUTHOR", "Seul l'auteur de la question peut accepter une réponse");
        }
        Answer previous = q.getAcceptedAnswerId() == null ? null : answers.findDetailed(q.getAcceptedAnswerId()).orElse(null);
        Answer next = null;
        if (answerId != null) {
            next = load(answerId);
            if (!next.getQuestionId().equals(questionId)) {
                throw ApiException.badRequest("ANSWER_NOT_IN_QUESTION", "Cette réponse appartient à une autre question");
            }
        }
        if (sameAnswer(previous, next)) {
            return questionService.get(questionId, me);
        }

        Long previousAuthor = previous == null ? null : previous.getAuthor().getId();
        Long nextAuthor = next == null ? null : next.getAuthor().getId();
        if (previousAuthor != null) {
            reputation.revoke(previousAuthor, ReputationReason.ANSWER_ACCEPTED, questionId, previous.getId(),
                    questionAuthorId);
        }
        if (nextAuthor != null && !nextAuthor.equals(questionAuthorId)) {
            reputation.grant(nextAuthor, ReputationReason.ANSWER_ACCEPTED, questionId, next.getId(), questionAuthorId);
            notifications.notify(nextAuthor, NotificationType.ANSWER_ACCEPTED, me.id(),
                    NotificationService.answer(next.getId(), q.getTitle(), questionId), null);
        }
        // Bonus de l'auteur de la question : acquis tant qu'une réponse d'un autre membre est acceptée.
        boolean bonusBefore = previousAuthor != null && !previousAuthor.equals(questionAuthorId);
        boolean bonusAfter = nextAuthor != null && !nextAuthor.equals(questionAuthorId);
        if (bonusBefore && !bonusAfter) {
            reputation.revoke(questionAuthorId, ReputationReason.ACCEPTED_AN_ANSWER, questionId, null, null);
        } else if (!bonusBefore && bonusAfter) {
            reputation.grant(questionAuthorId, ReputationReason.ACCEPTED_AN_ANSWER, questionId, null, null);
        }

        q.setAcceptedAnswerId(next == null ? null : next.getId());
        questions.saveAndFlush(q);
        return questionService.get(questionId, me);
    }

    public Answer load(Long id) {
        return answers.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("ANSWER_NOT_FOUND", "Réponse introuvable"));
    }

    /** Une réponse masquée (MOD-2) n'existe que pour son auteur et l'équipe, comme sa question. */
    public Answer loadVisible(Long id, ZetsuPrincipal me) {
        Answer a = load(id);
        if (a.isHidden() && !(me != null && (a.getAuthor().getId().equals(me.id()) || me.staff()))) {
            throw ApiException.notFound("ANSWER_NOT_FOUND", "Réponse introuvable");
        }
        questionService.loadVisible(a.getQuestionId(), me);
        return a;
    }

    private static boolean sameAnswer(Answer a, Answer b) {
        return a == null ? b == null : b != null && a.getId().equals(b.getId());
    }

    private static boolean canEdit(Answer a, ZetsuPrincipal me) {
        return me != null && (a.getAuthor().getId().equals(me.id()) || me.role() == Role.ADMIN);
    }

    private Map<Long, Integer> myVotes(List<Answer> list, ZetsuPrincipal me) {
        if (me == null || list.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = list.stream().map(Answer::getId).toList();
        return votes.findByVoterIdAndTargetTypeAndTargetIdIn(me.id(), VoteTarget.ANSWER, ids).stream()
                .collect(Collectors.toMap(Vote::getTargetId, Vote::getValue));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private AnswerView toView(Answer a, Question q, Integer myVote, ZetsuPrincipal me) {
        String authorCountry = a.getAuthor().getCountryCode();
        boolean sameContext = authorCountry != null && authorCountry.equals(q.getCountryCode());
        return new AnswerView(a.getId(), a.getQuestionId(), a.getBodyMarkdown(), a.getBodyHtml(), a.getCode(),
                AuthorSummary.from(a.getAuthor(), reputation.levelOf(a.getAuthor().getReputation())), a.getScore(),
                a.getId().equals(q.getAcceptedAnswerId()), sameContext, myVote, canEdit(a, me), a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
