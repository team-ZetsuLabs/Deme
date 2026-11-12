package dev.zetsu.playtest;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.playtest.PlaytestDtos.FeedbackRequest;
import dev.zetsu.playtest.PlaytestDtos.FeedbackView;
import dev.zetsu.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Retours des testeurs au porteur (bug, suggestion, autre). Seul un testeur en cours ou qui a terminé en envoie ;
 * seuls le porteur et l'équipe les lisent.
 */
@Service
public class PlaytestFeedbackService {

    private final PlaytestService playtests;
    private final TestFeedbackRepository feedback;
    private final TestParticipationRepository participations;
    private final UserRepository users;
    private final MarkdownRenderer markdown;
    private final NotificationService notifications;
    private final PlaytestClock clock;

    public PlaytestFeedbackService(PlaytestService playtests, TestFeedbackRepository feedback,
                                   TestParticipationRepository participations, UserRepository users,
                                   MarkdownRenderer markdown, NotificationService notifications, PlaytestClock clock) {
        this.playtests = playtests;
        this.feedback = feedback;
        this.participations = participations;
        this.users = users;
        this.markdown = markdown;
        this.notifications = notifications;
        this.clock = clock;
    }

    @Transactional
    public FeedbackView give(Long campaignId, FeedbackRequest req, ZetsuPrincipal me) {
        TestCampaign c = visible(campaignId, me);
        boolean tester = participations.findByCampaignIdAndTesterId(c.getId(), me.id())
                .map(p -> p.getStatus().running() || p.getStatus() == ParticipationStatus.COMPLETED)
                .orElse(false);
        if (!tester) {
            throw ApiException.forbidden("NOT_PLAYTEST_TESTER",
                    "Seul un testeur de la campagne peut envoyer un retour");
        }
        FeedbackKind kind = req.kind() == null ? FeedbackKind.OTHER : req.kind();
        String text = req.body().strip();
        TestFeedback f = new TestFeedback(c.getId(), users.getReferenceById(me.id()), kind, req.rating(), text,
                markdown.toSafeHtml(text), clock.now());
        feedback.saveAndFlush(f);
        notifications.notify(c.getOwner().getId(), NotificationType.PLAYTEST_FEEDBACK, me.id(),
                PlaytestService.target(c), kind.name());
        return toView(feedback.findDetailed(f.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public PageResponse<FeedbackView> list(Long campaignId, int page, int size, ZetsuPrincipal me) {
        TestCampaign c = visible(campaignId, me);
        if (!PlaytestService.isOwner(c, me) && !me.staff()) {
            throw ApiException.forbidden("NOT_PLAYTEST_OWNER", "Seul le porteur de la campagne lit les retours");
        }
        return PageResponse.of(feedback.findForCampaign(c.getId(), Paging.of(page, size)), this::toView);
    }

    private TestCampaign visible(Long campaignId, ZetsuPrincipal me) {
        TestCampaign c = playtests.load(campaignId);
        if (!playtests.visibleTo(c, me)) {
            throw ApiException.notFound("PLAYTEST_NOT_FOUND", "Campagne introuvable");
        }
        return c;
    }

    private FeedbackView toView(TestFeedback f) {
        return new FeedbackView(f.getId(), playtests.author(f.getAuthor()), f.getKind(), f.getRating(),
                f.getBodyHtml(), f.getCreatedAt());
    }
}
