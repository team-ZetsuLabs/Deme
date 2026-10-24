package dev.zetsu.community;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.community.CommunityDtos.AdminCommunityProposal;
import dev.zetsu.community.CommunityDtos.CommunityProposalView;
import dev.zetsu.community.CommunityDtos.CommunityRequest;
import dev.zetsu.community.CommunityDtos.ProposalReviewRequest;
import dev.zetsu.job.JobDtos.ReviewDecision;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.reputation.Level;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * COM-2, sur le modèle d'Area 51 chez Stack Exchange : un Référent propose une communauté, l'équipe l'accepte (elle
 * est créée, le proposeur en devient le premier Référent) ou la refuse avec un motif, comme une offre (JOB-4).
 */
@Service
public class CommunityProposalService {

    private final CommunityProposalRepository proposals;
    private final CommunityService communities;
    private final UserRepository users;
    private final ReputationService reputation;
    private final NotificationService notifications;

    public CommunityProposalService(CommunityProposalRepository proposals, CommunityService communities,
                                    UserRepository users, ReputationService reputation,
                                    NotificationService notifications) {
        this.proposals = proposals;
        this.communities = communities;
        this.users = users;
        this.reputation = reputation;
        this.notifications = notifications;
    }

    @Transactional
    public CommunityProposalView propose(CommunityRequest req, ZetsuPrincipal me) {
        User proposer = users.findById(me.id()).orElseThrow();
        // L'équipe n'a pas de niveau à atteindre ; les autres membres, si (section 8).
        if (!me.staff() && !reputation.levelOf(proposer.getReputation()).atLeast(Level.REFERENT)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "LEVEL_TOO_LOW",
                    "Il faut atteindre le niveau Référent pour proposer une communauté");
        }
        CommunityService.Scope scope = CommunityService.scope(req);
        String name = req.name().trim();
        String slug = CommunityService.slugify(name);
        if (slug.isEmpty()) {
            throw ApiException.invalidField("name", "Le nom doit contenir au moins une lettre ou un chiffre");
        }
        communities.ensureAvailable(slug, name, scope, null);
        if (alreadyProposed(name, scope)) {
            throw ApiException.conflict("COMMUNITY_EXISTS", "Une proposition en attente porte déjà sur ce nom, "
                    + "ce pays ou cette étiquette");
        }
        CommunityProposal p = proposals.saveAndFlush(new CommunityProposal(proposer, name, scope.kind(),
                scope.countryCode(), scope.tagName(), req.description().trim(), CommunityService.rules(req.rules())));
        return toView(p);
    }

    @Transactional(readOnly = true)
    public List<CommunityProposalView> mine(ZetsuPrincipal me) {
        return proposals.findByProposerIdOrderByCreatedAtDescIdDesc(me.id()).stream().map(this::toView).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminCommunityProposal> queue(ProposalStatus status, int page, int size) {
        return PageResponse.of(proposals.findByStatusOrderByCreatedAtAscIdAsc(status, Paging.of(page, size)),
                this::toAdmin);
    }

    @Transactional
    public AdminCommunityProposal decide(Long id, ProposalReviewRequest req, ZetsuPrincipal me) {
        CommunityProposal p = proposals.findById(id)
                .orElseThrow(() -> ApiException.notFound("PROPOSAL_NOT_FOUND", "Proposition introuvable"));
        if (p.getStatus() != ProposalStatus.PENDING) {
            throw ApiException.conflict("PROPOSAL_NOT_PENDING", "Cette proposition a déjà été traitée");
        }
        String reason = req.reason() == null || req.reason().isBlank() ? null : req.reason().trim();
        if (req.decision() == ReviewDecision.APPROVE) {
            // Une communauté a pu être créée entre-temps : 409 COMMUNITY_EXISTS, à refuser avec ce motif.
            Community c = communities.create(p.getName(),
                    new CommunityService.Scope(p.getKind(), p.getCountryCode(), p.getTagName()),
                    p.getDescription(), p.getRules(), me.id());
            communities.addFounder(c, p.getProposer().getId());
            p.approve(c, me.id());
        } else {
            if (reason == null) {
                throw ApiException.badRequest("REASON_REQUIRED", "Indiquez le motif du refus au Référent");
            }
            p.reject(reason, me.id());
        }
        // Décision de l'équipe : le Référent ne voit pas qui l'a prise (acteur null).
        notifications.notify(p.getProposer().getId(), NotificationType.COMMUNITY_PROPOSAL_DECISION, null,
                NotificationService.target(NotificationTargetType.COMMUNITY_PROPOSAL, p.getId(), p.getName()),
                p.getStatus().name());
        return toAdmin(p);
    }

    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        proposals.deletePendingOf(event.userId());
    }

    private boolean alreadyProposed(String name, CommunityService.Scope scope) {
        return proposals.existsByStatusAndNameIgnoreCase(ProposalStatus.PENDING, name)
                || scope.kind() == CommunityKind.COUNTRY && proposals.existsByStatusAndKindAndCountryCode(
                ProposalStatus.PENDING, CommunityKind.COUNTRY, scope.countryCode())
                || scope.kind() == CommunityKind.TECH && proposals.existsByStatusAndKindAndTagName(
                ProposalStatus.PENDING, CommunityKind.TECH, scope.tagName());
    }

    private CommunityProposalView toView(CommunityProposal p) {
        return new CommunityProposalView(p.getId(), p.getName(), p.getKind(), p.getCountryCode(), p.getTagName(),
                p.getStatus(), p.getRejectionReason(), slug(p), p.getCreatedAt());
    }

    private AdminCommunityProposal toAdmin(CommunityProposal p) {
        User u = p.getProposer();
        return new AdminCommunityProposal(p.getId(), p.getName(), p.getKind(), p.getCountryCode(), p.getTagName(),
                p.getDescription(), List.copyOf(p.getRules()), p.getStatus(), p.getRejectionReason(), slug(p),
                AuthorSummary.from(u, reputation.levelOf(u.getReputation())), p.getCreatedAt(), p.getReviewedAt());
    }

    private static String slug(CommunityProposal p) {
        return p.getCommunity() == null ? null : p.getCommunity().getSlug();
    }
}
