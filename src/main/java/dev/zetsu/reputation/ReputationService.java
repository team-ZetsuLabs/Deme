package dev.zetsu.reputation;

import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;

/**
 * Chaque gain ou perte est un événement enregistré (REP-1) ; la réputation d'un membre en est la somme.
 * Garde-fous (REP-3) : plafond quotidien, nombre de questions rémunérées par jour, nombre de votes rémunérés
 * par jour entre les deux mêmes comptes.
 */
@Service
public class ReputationService {

    private static final List<String> CAPPED = Arrays.stream(ReputationReason.values())
            .filter(ReputationReason::capped).map(Enum::name).toList();
    private static final List<String> UPVOTES =
            List.of(ReputationReason.QUESTION_UPVOTED.name(), ReputationReason.ANSWER_UPVOTED.name());

    private final ReputationEventRepository events;
    private final UserRepository users;
    private final ReputationProperties props;
    private final Clock clock;

    public ReputationService(ReputationEventRepository events, UserRepository users, ReputationProperties props) {
        this.events = events;
        this.users = users;
        this.props = props;
        this.clock = Clock.systemUTC();
    }

    /**
     * Accorde les points du barème, réduits si un garde-fou s'applique.
     *
     * @param sourceUserId membre qui provoque le gain (votant, auteur qui accepte) ou null
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void grant(Long userId, ReputationReason reason, Long questionId, Long answerId, Long sourceUserId) {
        int delta = reason.points();
        if (reason.capped()) {
            Instant today = LocalDate.now(clock).atStartOfDay(ZoneOffset.UTC).toInstant();
            if (reason == ReputationReason.QUESTION_ASKED
                    && events.rewardsSince(userId, reason.name(), today) >= props.rewardedQuestionsPerDay()) {
                return;
            }
            if (UPVOTES.contains(reason.name()) && sourceUserId != null
                    && events.rewardsFromSince(userId, sourceUserId, UPVOTES, today) >= props.rewardedVotesPerPairPerDay()) {
                return;
            }
            int remaining = props.dailyCap() - events.gainedSince(userId, CAPPED, today);
            delta = Math.min(delta, Math.max(remaining, 0));
        }
        if (delta != 0) {
            record(userId, delta, reason, questionId, answerId, sourceUserId);
        }
    }

    /** Retire exactement ce qui avait été accordé pour cette cause (vote retiré, acceptation changée…). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void revoke(Long userId, ReputationReason reason, Long questionId, Long answerId, Long sourceUserId) {
        int net = events.net(userId, reason.name(), questionId, answerId, sourceUserId);
        if (net != 0) {
            record(userId, -net, reason, questionId, answerId, sourceUserId);
        }
    }

    public Level levelOf(int reputation) {
        return props.levelOf(reputation);
    }

    private void record(Long userId, int delta, ReputationReason reason, Long questionId, Long answerId,
                        Long sourceUserId) {
        events.saveAndFlush(new ReputationEvent(userId, delta, reason, questionId, answerId, sourceUserId));
        users.addReputation(userId, delta);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReputationDtos.ReputationEntry> history(Long userId, int page, int size) {
        return PageResponse.of(events.findByUserIdOrderByCreatedAtDescIdDesc(userId, Paging.of(page, size)),
                ReputationDtos.ReputationEntry::from);
    }
}
