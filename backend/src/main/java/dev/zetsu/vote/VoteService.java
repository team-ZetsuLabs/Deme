package dev.zetsu.vote;

import dev.zetsu.answer.Answer;
import dev.zetsu.answer.AnswerRepository;
import dev.zetsu.answer.AnswerService;
import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.question.Question;
import dev.zetsu.question.QuestionRepository;
import dev.zetsu.question.QuestionService;
import dev.zetsu.reputation.Level;
import dev.zetsu.reputation.ReputationReason;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.UserRepository;
import dev.zetsu.vote.VoteDtos.VoteResult;
import org.springframework.dao.DataIntegrityViolationException;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * QA-4 : un vote par membre et par contenu, annulable, jamais sur ses propres contenus, à partir du niveau
 * Membre. Revoter la même valeur renvoie 409 ; voter l'inverse remplace le vote. Seul un vote positif rapporte
 * des points à l'auteur (section 8) ; un vote négatif ne baisse que le score du contenu.
 */
@Service
public class VoteService {

    private final VoteRepository votes;
    private final QuestionService questionService;
    private final QuestionRepository questions;
    private final AnswerService answerService;
    private final AnswerRepository answers;
    private final ReputationService reputation;
    private final UserRepository users;
    private final NotificationService notifications;

    public VoteService(VoteRepository votes, QuestionService questionService, QuestionRepository questions,
                       AnswerService answerService, AnswerRepository answers, ReputationService reputation,
                       UserRepository users, NotificationService notifications) {
        this.votes = votes;
        this.questionService = questionService;
        this.questions = questions;
        this.answerService = answerService;
        this.answers = answers;
        this.reputation = reputation;
        this.users = users;
        this.notifications = notifications;
    }

    /** {@code title} : titre de la question, repris dans la notification de vote (NOT-1). */
    private record Target(VoteTarget type, Long id, Long authorId, Long questionId, Long answerId, String title) {
    }

    @Transactional
    public VoteResult voteQuestion(Long questionId, int value, ZetsuPrincipal me) {
        return vote(question(questionId, me), value, me);
    }

    @Transactional
    public VoteResult unvoteQuestion(Long questionId, ZetsuPrincipal me) {
        return unvote(question(questionId, me), me);
    }

    @Transactional
    public VoteResult voteAnswer(Long answerId, int value, ZetsuPrincipal me) {
        return vote(answer(answerId, me), value, me);
    }

    @Transactional
    public VoteResult unvoteAnswer(Long answerId, ZetsuPrincipal me) {
        return unvote(answer(answerId, me), me);
    }

    private Target question(Long id, ZetsuPrincipal me) {
        Question q = questionService.loadVisible(id, me);
        return new Target(VoteTarget.QUESTION, q.getId(), q.getAuthor().getId(), q.getId(), null, q.getTitle());
    }

    private Target answer(Long id, ZetsuPrincipal me) {
        Answer a = answerService.loadVisible(id, me);
        String title = questions.findById(a.getQuestionId()).map(Question::getTitle).orElse("");
        return new Target(VoteTarget.ANSWER, a.getId(), a.getAuthor().getId(), a.getQuestionId(), a.getId(), title);
    }

    private VoteResult vote(Target t, int value, ZetsuPrincipal me) {
        if (value != 1 && value != -1) {
            throw ApiException.badRequest("INVALID_VOTE", "Le vote doit valoir 1 ou -1");
        }
        if (t.authorId().equals(me.id())) {
            throw ApiException.forbidden("CANNOT_VOTE_OWN_CONTENT", "Vous ne pouvez pas voter pour votre propre contenu");
        }
        int myReputation = users.findById(me.id()).map(u -> u.getReputation()).orElse(0);
        if (!reputation.levelOf(myReputation).atLeast(Level.MEMBER)) {
            throw ApiException.forbidden("LEVEL_TOO_LOW", "Il faut atteindre le niveau Membre pour voter");
        }
        Optional<Vote> existing = votes.findByVoterIdAndTargetTypeAndTargetId(me.id(), t.type(), t.id());
        if (existing.isPresent()) {
            Vote vote = existing.get();
            if (vote.getValue() == value) {
                throw ApiException.conflict("ALREADY_VOTED", "Vous avez déjà voté");
            }
            undoEffects(t, vote.getValue(), me.id());
            vote.setValue(value);
            votes.saveAndFlush(vote);
        } else {
            try {
                votes.saveAndFlush(new Vote(me.id(), t.type(), t.id(), value));
            } catch (DataIntegrityViolationException e) {
                throw ApiException.conflict("ALREADY_VOTED", "Vous avez déjà voté");
            }
        }
        applyEffects(t, value, me.id());
        return new VoteResult(currentScore(t), value);
    }

    private VoteResult unvote(Target t, ZetsuPrincipal me) {
        Vote vote = votes.findByVoterIdAndTargetTypeAndTargetId(me.id(), t.type(), t.id())
                .orElseThrow(() -> ApiException.notFound("VOTE_NOT_FOUND", "Aucun vote à retirer"));
        undoEffects(t, vote.getValue(), me.id());
        votes.delete(vote);
        votes.flush();
        return new VoteResult(currentScore(t), null);
    }

    private void applyEffects(Target t, int value, Long voterId) {
        addScore(t, value);
        if (value > 0) {
            reputation.grant(t.authorId(), upvoteReason(t), t.questionId(), t.answerId(), voterId);
            notifications.notifyOnce(t.authorId(), NotificationType.VOTE_RECEIVED, voterId,
                    t.type() == VoteTarget.QUESTION
                            ? NotificationService.target(NotificationTargetType.QUESTION, t.id(), t.title())
                            : NotificationService.answer(t.id(), t.title(), t.questionId()));
        }
    }

    private void undoEffects(Target t, int value, Long voterId) {
        addScore(t, -value);
        if (value > 0) {
            reputation.revoke(t.authorId(), upvoteReason(t), t.questionId(), t.answerId(), voterId);
        }
    }

    private void addScore(Target t, int delta) {
        if (t.type() == VoteTarget.QUESTION) {
            questions.addScore(t.id(), delta);
        } else {
            answers.addScore(t.id(), delta);
        }
    }

    private int currentScore(Target t) {
        return t.type() == VoteTarget.QUESTION ? questions.currentScore(t.id()) : answers.currentScore(t.id());
    }

    private static ReputationReason upvoteReason(Target t) {
        return t.type() == VoteTarget.QUESTION ? ReputationReason.QUESTION_UPVOTED : ReputationReason.ANSWER_UPVOTED;
    }
}
