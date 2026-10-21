package dev.zetsu.reputation;

import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReputationService {

    private final ReputationEventRepository events;
    private final UserRepository users;

    public ReputationService(ReputationEventRepository events, UserRepository users) {
        this.events = events;
        this.users = users;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void grant(Long userId, ReputationReason reason, Long questionId, Long answerId) {
        record(userId, reason.points(), reason, questionId, answerId);
    }

    /** Annule un gain ou une perte précédente (vote retiré, réponse acceptée changée…). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void revoke(Long userId, ReputationReason reason, Long questionId, Long answerId) {
        record(userId, -reason.points(), reason, questionId, answerId);
    }

    private void record(Long userId, int delta, ReputationReason reason, Long questionId, Long answerId) {
        events.save(new ReputationEvent(userId, delta, reason, questionId, answerId));
        users.addReputation(userId, delta);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReputationDtos.ReputationEntry> history(Long userId, int page, int size) {
        return PageResponse.of(events.findByUserIdOrderByCreatedAtDescIdDesc(userId, Paging.of(page, size)),
                ReputationDtos.ReputationEntry::from);
    }
}
