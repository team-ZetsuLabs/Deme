package dev.zetsu.playtest;

import dev.zetsu.notification.NotificationDtos.NotificationTarget;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.playtest.PlaytestEvents.Action;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.AccountDeleted;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Suivi automatique des participations (TST-3, TST-4), une fois par heure : chaque étape n'agit qu'une fois par
 * participation, la tâche peut donc tourner aussi souvent qu'on veut.
 */
@Component
public class PlaytestJobs {

    private static final Logger log = LoggerFactory.getLogger(PlaytestJobs.class);
    static final String EXPIRED_REASON = "Installation non déclarée sous 48 heures";

    private final TestCampaignRepository campaigns;
    private final TestParticipationRepository participations;
    private final PlaytestEvents events;
    private final ReputationService reputation;
    private final NotificationService notifications;
    private final PlaytestClock clock;

    public PlaytestJobs(TestCampaignRepository campaigns, TestParticipationRepository participations,
                        PlaytestEvents events, ReputationService reputation, NotificationService notifications,
                        PlaytestClock clock) {
        this.campaigns = campaigns;
        this.participations = participations;
        this.events = events;
        this.reputation = reputation;
        this.notifications = notifications;
        this.clock = clock;
    }

    @Scheduled(fixedDelay = 1, initialDelay = 1, timeUnit = TimeUnit.HOURS)
    @Transactional
    public void run() {
        Instant now = clock.now();
        Set<Long> touched = new HashSet<>();
        int expired = 0;
        int completed = 0;
        for (TestParticipation p : participations.findRunning(ParticipationStatus.RUNNING)) {
            TestCampaign c = p.getCampaign();
            NotificationTarget target = PlaytestService.target(c);
            Long tester = p.getTester().getId();
            Long owner = c.getOwner().getId();
            if (p.getStatus() == ParticipationStatus.JOINED) {
                if (!p.getJoinedAt().plus(PlaytestRules.INSTALL_DEADLINE).isAfter(now)) {
                    // Place libérée : elle sera reprise par le prochain testeur.
                    p.stop(ParticipationStatus.DROPPED, EXPIRED_REASON, now);
                    events.log(c.getId(), p.getId(), null, Action.EXPIRED, EXPIRED_REASON, now);
                    notifications.notify(owner, NotificationType.PLAYTEST_TESTER_LEFT, null, target, "EXPIRED");
                    expired++;
                } else if (!p.isInstallReminded()
                        && !p.getJoinedAt().plus(PlaytestRules.INSTALL_REMINDER_AFTER).isAfter(now)) {
                    p.markInstallReminded();
                    notifications.notify(tester, NotificationType.PLAYTEST_INSTALL_REMINDER, null, target, null);
                }
                continue;
            }
            // Décompte en cours (déclaré ou vérifié).
            if (!p.getEndsAt().isAfter(now)) {
                p.complete(now);
                reputation.grantForPlaytest(tester, p.getId());
                events.log(c.getId(), p.getId(), null, Action.PARTICIPATION_COMPLETED, null, now);
                notifications.notify(tester, NotificationType.PLAYTEST_PARTICIPATION_DONE, null, target, null);
                notifications.notify(owner, NotificationType.PLAYTEST_PARTICIPATION_DONE, tester, target, null);
                touched.add(c.getId());
                completed++;
                continue;
            }
            if (!p.isEndingNotified() && !p.getEndsAt().minus(PlaytestRules.ENDING_SOON).isAfter(now)) {
                p.markEndingNotified();
                notifications.notify(tester, NotificationType.PLAYTEST_ENDING_SOON, null, target, null);
                notifications.notify(owner, NotificationType.PLAYTEST_ENDING_SOON, tester, target, null);
            }
            if (p.getStayRemindedAt() == null && p.needsAttention(now)) {
                // L'abandon n'est jamais automatique ici : seulement un rappel, et « à confirmer » pour le porteur.
                p.markStayReminded(now);
                notifications.notify(tester, NotificationType.PLAYTEST_STAY_REMINDER, null, target, null);
            }
        }
        participations.flush();
        for (Long id : touched) {
            completeIfReached(id, now);
        }
        int erased = participations.eraseEmailsEndedBefore(now.minus(PlaytestRules.EMAIL_RETENTION));
        if (expired + completed + erased > 0) {
            log.info("Tests fermés : {} place(s) libérée(s), {} participation(s) terminée(s), {} adresse(s) effacée(s)",
                    expired, completed, erased);
        }
    }

    /** Objectif atteint : autant de participations terminées que de places. */
    private void completeIfReached(Long campaignId, Instant now) {
        TestCampaign c = campaigns.findById(campaignId).orElse(null);
        if (c == null || (c.getStatus() != CampaignStatus.ACTIVE && c.getStatus() != CampaignStatus.SUSPENDED)) {
            return;
        }
        long done = participations.countByCampaignIdAndStatusIn(c.getId(), List.of(ParticipationStatus.COMPLETED));
        if (done >= c.getTestersTarget()) {
            c.setStatus(CampaignStatus.COMPLETED, now);
            events.log(c.getId(), null, null, Action.COMPLETED, null, now);
        }
    }

    /** AUTH-6 : campagnes non terminées clôturées, participations en cours abandonnées, adresses Google effacées. */
    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        Instant now = clock.now();
        campaigns.closeAllOf(event.userId(), now);
        participations.leaveAllOf(event.userId(), now);
    }
}
