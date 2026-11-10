package dev.zetsu.question;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationRepository;
import dev.zetsu.question.QuestionDtos.QuestionContext;
import dev.zetsu.question.QuestionDtos.QuestionDetail;
import dev.zetsu.question.QuestionDtos.QuestionRequest;
import dev.zetsu.question.QuestionDtos.QuestionSummary;
import dev.zetsu.question.QuestionDtos.SimilarQuestion;
import dev.zetsu.reputation.ReputationEventRepository;
import dev.zetsu.reputation.ReputationReason;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.Role;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import dev.zetsu.vote.Vote;
import dev.zetsu.vote.VoteRepository;
import dev.zetsu.vote.VoteTarget;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class QuestionService {

    private static final int EXCERPT_LENGTH = 200;
    private static final int SIMILAR_MIN_TITLE = 10;
    private static final int SIMILAR_MAX = 10;

    private final QuestionRepository questions;
    private final QuestionSearch search;
    private final UserRepository users;
    private final VoteRepository votes;
    private final TagService tagService;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;
    private final ReputationEventRepository reputationEvents;
    private final NotificationRepository notifications;

    public QuestionService(QuestionRepository questions, QuestionSearch search, UserRepository users,
                           VoteRepository votes, TagService tagService, MarkdownRenderer markdown,
                           ReputationService reputation, ReputationEventRepository reputationEvents,
                           NotificationRepository notifications) {
        this.questions = questions;
        this.search = search;
        this.users = users;
        this.votes = votes;
        this.tagService = tagService;
        this.markdown = markdown;
        this.reputation = reputation;
        this.reputationEvents = reputationEvents;
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public PageResponse<QuestionSummary> list(QuestionSearch.Criteria criteria, int page, int size) {
        Paging.of(page, size);
        QuestionSearch.Result result = search.search(criteria, page, size);
        Map<Long, Question> byId = questions.findAllDetailed(result.ids()).stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));
        List<QuestionSummary> items = result.ids().stream()
                .map(byId::get)
                .filter(q -> q != null)
                .map(this::toSummary)
                .toList();
        return new PageResponse<>(items, page, size, result.total());
    }

    /** Questions similaires (QA-8). Un titre trop court pour être parlant ne renvoie rien, sans erreur. */
    public List<SimilarQuestion> similar(String title, Long excludeId, int limit) {
        String text = title == null ? "" : title.strip();
        if (text.length() < SIMILAR_MIN_TITLE) {
            return List.of();
        }
        if (limit < 1 || limit > SIMILAR_MAX) {
            throw ApiException.badRequest("INVALID_LIMIT", "limit doit être compris entre 1 et " + SIMILAR_MAX);
        }
        return search.similar(text.length() > 150 ? text.substring(0, 150) : text, excludeId, limit);
    }

    @Transactional(readOnly = true)
    public QuestionDetail get(Long id, ZetsuPrincipal me) {
        return toDetail(loadVisible(id, me), me);
    }

    @Transactional
    public QuestionDetail create(QuestionRequest req, ZetsuPrincipal me) {
        User author = users.getReferenceById(me.id());
        Question q = new Question(author);
        apply(q, req);
        questions.saveAndFlush(q);
        reputation.grant(me.id(), ReputationReason.QUESTION_ASKED, q.getId(), null, null);
        return toDetail(load(q.getId()), me);
    }

    @Transactional
    public QuestionDetail update(Long id, QuestionRequest req, ZetsuPrincipal me) {
        Question q = load(id);
        if (!canEdit(q, me)) {
            throw ApiException.forbidden("NOT_QUESTION_AUTHOR", "Seul l'auteur peut modifier cette question");
        }
        apply(q, req);
        q.touch();
        questions.saveAndFlush(q);
        return toDetail(q, me);
    }

    /**
     * QA-3 : l'auteur (ou un administrateur) supprime une question tant que personne n'y a répondu, pour ne pas
     * effacer le travail des autres. Les points gagnés grâce à elle (question posée, votes reçus) sont retirés.
     */
    @Transactional
    public void delete(Long id, ZetsuPrincipal me) {
        Question q = load(id);
        if (!canEdit(q, me)) {
            throw ApiException.forbidden("NOT_QUESTION_AUTHOR", "Seul l'auteur peut supprimer cette question");
        }
        if (questions.softDelete(id) == 0) {
            throw ApiException.conflict("QUESTION_HAS_ANSWERS",
                    "Cette question a déjà reçu une réponse : elle ne peut plus être supprimée");
        }
        for (Object[] cause : reputationEvents.openCausesOnQuestion(id)) {
            reputation.revoke(((Number) cause[0]).longValue(), ReputationReason.valueOf((String) cause[1]), id, null,
                    cause[2] == null ? null : ((Number) cause[2]).longValue());
        }
        votes.deleteAllOn(VoteTarget.QUESTION, id);
        notifications.deleteAllAboutQuestion(id);
    }

    /** Une question supprimée (QA-3) n'existe plus pour personne. */
    public Question load(Long id) {
        return questions.findDetailed(id).filter(q -> !q.isDeleted())
                .orElseThrow(() -> ApiException.notFound("QUESTION_NOT_FOUND", "Question introuvable"));
    }

    /** Une question masquée (MOD-2) n'existe que pour son auteur et l'équipe : 404 pour les autres. */
    public Question loadVisible(Long id, ZetsuPrincipal me) {
        Question q = load(id);
        if (q.isHidden() && !(me != null && (q.getAuthor().getId().equals(me.id()) || me.staff()))) {
            throw ApiException.notFound("QUESTION_NOT_FOUND", "Question introuvable");
        }
        return q;
    }

    private void apply(Question q, QuestionRequest req) {
        q.setTitle(req.title().trim());
        q.setBody(req.body(), markdown.toSafeHtml(req.body()));
        q.setCode(blankToNull(req.code()));
        q.setTags(tagService.resolve(req.tags()));
        QuestionContext ctx = req.context();
        q.setCountryCode(ctx == null ? null : blankToNull(ctx.countryCode()));
        q.setMobileMoneyOperator(ctx == null ? null : ctx.mobileMoneyOperator());
        q.setNetworkQuality(ctx == null ? null : ctx.networkQuality());
        q.setTechVersion(ctx == null ? null : blankToNull(ctx.techVersion()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }

    private AuthorSummary author(User u) {
        return AuthorSummary.from(u, reputation.levelOf(u.getReputation()));
    }

    static boolean canEdit(Question q, ZetsuPrincipal me) {
        return me != null && (q.getAuthor().getId().equals(me.id()) || me.role() == Role.ADMIN);
    }

    private static List<String> tagNames(Question q) {
        return q.getTags().stream().map(Tag::getName).sorted(Comparator.naturalOrder()).toList();
    }

    private QuestionSummary toSummary(Question q) {
        String text = Jsoup.parse(q.getBodyHtml()).text();
        String excerpt = text.length() <= EXCERPT_LENGTH ? text : text.substring(0, EXCERPT_LENGTH).trim() + "…";
        return new QuestionSummary(q.getId(), q.getTitle(), excerpt, tagNames(q), QuestionContext.from(q),
                author(q.getAuthor()), q.getScore(), q.getAnswerCount(), q.getAcceptedAnswerId() != null,
                q.getCreatedAt());
    }

    private QuestionDetail toDetail(Question q, ZetsuPrincipal me) {
        Integer myVote = me == null ? null : votes
                .findByVoterIdAndTargetTypeAndTargetId(me.id(), VoteTarget.QUESTION, q.getId())
                .map(Vote::getValue)
                .orElse(null);
        return new QuestionDetail(q.getId(), q.getTitle(), q.getBodyMarkdown(), q.getBodyHtml(), q.getCode(),
                tagNames(q),
                QuestionContext.from(q), author(q.getAuthor()), q.getScore(), q.getAnswerCount(),
                q.getAcceptedAnswerId(), myVote, canEdit(q, me), q.getCreatedAt(), q.getUpdatedAt(),
                canEdit(q, me) && q.getAnswerCount() == 0);
    }
}
