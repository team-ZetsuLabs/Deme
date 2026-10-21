package dev.zetsu.question;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.question.QuestionDtos.QuestionContext;
import dev.zetsu.question.QuestionDtos.QuestionDetail;
import dev.zetsu.question.QuestionDtos.QuestionRequest;
import dev.zetsu.question.QuestionDtos.QuestionSummary;
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

    private final QuestionRepository questions;
    private final QuestionSearch search;
    private final UserRepository users;
    private final VoteRepository votes;
    private final TagService tagService;
    private final MarkdownRenderer markdown;

    public QuestionService(QuestionRepository questions, QuestionSearch search, UserRepository users,
                           VoteRepository votes, TagService tagService, MarkdownRenderer markdown) {
        this.questions = questions;
        this.search = search;
        this.users = users;
        this.votes = votes;
        this.tagService = tagService;
        this.markdown = markdown;
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

    @Transactional(readOnly = true)
    public QuestionDetail get(Long id, ZetsuPrincipal me) {
        return toDetail(load(id), me);
    }

    @Transactional
    public QuestionDetail create(QuestionRequest req, ZetsuPrincipal me) {
        User author = users.getReferenceById(me.id());
        Question q = new Question(author);
        apply(q, req);
        questions.saveAndFlush(q);
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

    public Question load(Long id) {
        return questions.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("QUESTION_NOT_FOUND", "Question introuvable"));
    }

    private void apply(Question q, QuestionRequest req) {
        q.setTitle(req.title().trim());
        q.setBody(req.body(), markdown.toSafeHtml(req.body()));
        q.setTags(tagService.resolve(req.tags()));
        QuestionContext ctx = req.context();
        q.setCountryCode(ctx == null ? null : ctx.countryCode());
        q.setMobileMoneyOperator(ctx == null ? null : ctx.mobileMoneyOperator());
        q.setNetworkQuality(ctx == null ? null : ctx.networkQuality());
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
                AuthorSummary.from(q.getAuthor()), q.getScore(), q.getAnswerCount(), q.getAcceptedAnswerId() != null,
                q.getCreatedAt());
    }

    private QuestionDetail toDetail(Question q, ZetsuPrincipal me) {
        Integer myVote = me == null ? null : votes
                .findByVoterIdAndTargetTypeAndTargetId(me.id(), VoteTarget.QUESTION, q.getId())
                .map(Vote::getValue)
                .orElse(null);
        return new QuestionDetail(q.getId(), q.getTitle(), q.getBodyMarkdown(), q.getBodyHtml(), tagNames(q),
                QuestionContext.from(q), AuthorSummary.from(q.getAuthor()), q.getScore(), q.getAnswerCount(),
                q.getAcceptedAnswerId(), myVote, canEdit(q, me), q.getCreatedAt(), q.getUpdatedAt());
    }
}
