package dev.zetsu.vote;

import dev.zetsu.answer.Answer;
import dev.zetsu.answer.AnswerRepository;
import dev.zetsu.answer.AnswerService;
import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.question.Question;
import dev.zetsu.question.QuestionRepository;
import dev.zetsu.question.QuestionService;
import dev.zetsu.reputation.ReputationReason;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.vote.VoteDtos.VoteResult;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Un vote par membre et par contenu. Revoter la même valeur renvoie 409 ; voter l'inverse remplace le vote.
 * Chaque changement met à jour le score du contenu et la réputation de son auteur.
 */
@Service
public class VoteService {

    private final VoteRepository votes;
    private final QuestionService questionService;
    private final QuestionRepository questions;
    private final AnswerService answerService;
    private final AnswerRepository answers;
    private final ReputationService reputation;

    public VoteService(VoteRepository votes, QuestionService questionService, QuestionRepository questions,
                       AnswerService answerService, AnswerRepository answers, ReputationService reputation) {
        this.votes = votes;
        this.questionService = questionService;
        this.questions = questions;
        this.answerService = answerService;
        this.answers = answers;
        this.reputation = reputation;
    }

    private record Target(VoteTarget type, Long id, Long authorId, Long questionId, Long answerId) {
    }

    @Transactional
    public VoteResult voteQuestion(Long questionId, int value, ZetsuPrincipal me) {
        return vote(question(questionId), value, me);
    }

    @Transactional
    public VoteResult unvoteQuestion(Long questionId, ZetsuPrincipal me) {
        return unvote(question(questionId), me);
    }

    @Transactional
    public VoteResult voteAnswer(Long answerId, int value, ZetsuPrincipal me) {
        return vote(answer(answerId), value, me);
    }

    @Transactional
    public VoteResult unvoteAnswer(Long answerId, ZetsuPrincipal me) {
        return unvote(answer(answerId), me);
    }

    private Target question(Long id) {
        Question q = questionService.load(id);
        return new Target(VoteTarget.QUESTION, q.getId(), q.getAuthor().getId(), q.getId(), null);
    }

    private Target answer(Long id) {
        Answer a = answerService.load(id);
        return new Target(VoteTarget.ANSWER, a.getId(), a.getAuthor().getId(), a.getQuestionId(), a.getId());
    }

    private VoteResult vote(Target t, int value, ZetsuPrincipal me) {
        if (value != 1 && value != -1) {
            throw ApiException.badRequest("INVALID_VOTE", "Le vote doit valoir 1 ou -1");
        }
        if (t.authorId().equals(me.id())) {
            throw ApiException.forbidden("CANNOT_VOTE_OWN_CONTENT", "Vous ne pouvez pas voter pour votre propre contenu");
        }
        Optional<Vote> existing = votes.findByVoterIdAndTargetTypeAndTargetId(me.id(), t.type(), t.id());
        if (existing.isPresent()) {
            Vote vote = existing.get();
            if (vote.getValue() == value) {
                throw ApiException.conflict("ALREADY_VOTED", "Vous avez déjà voté");
            }
            undoEffects(t, vote.getValue());
            vote.setValue(value);
            votes.saveAndFlush(vote);
        } else {
            try {
                votes.saveAndFlush(new Vote(me.id(), t.type(), t.id(), value));
            } catch (DataIntegrityViolationException e) {
                throw ApiException.conflict("ALREADY_VOTED", "Vous avez déjà voté");
            }
        }
        applyEffects(t, value);
        return new VoteResult(currentScore(t), value);
    }

    private VoteResult unvote(Target t, ZetsuPrincipal me) {
        Vote vote = votes.findByVoterIdAndTargetTypeAndTargetId(me.id(), t.type(), t.id())
                .orElseThrow(() -> ApiException.notFound("VOTE_NOT_FOUND", "Aucun vote à retirer"));
        undoEffects(t, vote.getValue());
        votes.delete(vote);
        votes.flush();
        return new VoteResult(currentScore(t), null);
    }

    private void applyEffects(Target t, int value) {
        addScore(t, value);
        reputation.grant(t.authorId(), reason(t, value), t.questionId(), t.answerId());
    }

    private void undoEffects(Target t, int value) {
        addScore(t, -value);
        reputation.revoke(t.authorId(), reason(t, value), t.questionId(), t.answerId());
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

    private static ReputationReason reason(Target t, int value) {
        if (t.type() == VoteTarget.QUESTION) {
            return value > 0 ? ReputationReason.QUESTION_UPVOTED : ReputationReason.QUESTION_DOWNVOTED;
        }
        return value > 0 ? ReputationReason.ANSWER_UPVOTED : ReputationReason.ANSWER_DOWNVOTED;
    }
}
