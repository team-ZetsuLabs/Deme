package dev.zetsu.community;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CommunityProposalRepository extends JpaRepository<CommunityProposal, Long> {

    @EntityGraph(attributePaths = "community")
    List<CommunityProposal> findByProposerIdOrderByCreatedAtDescIdDesc(Long proposerId);

    /** File de l'équipe : les plus anciennes d'abord, comme les offres à valider. */
    @EntityGraph(attributePaths = {"proposer", "community"})
    Page<CommunityProposal> findByStatusOrderByCreatedAtAscIdAsc(ProposalStatus status, Pageable pageable);

    boolean existsByStatusAndNameIgnoreCase(ProposalStatus status, String name);

    boolean existsByStatusAndKindAndCountryCode(ProposalStatus status, CommunityKind kind, String countryCode);

    boolean existsByStatusAndKindAndTagName(ProposalStatus status, CommunityKind kind, String tagName);

    /** AUTH-6 : les propositions en attente d'un compte supprimé sont retirées ; les décisions restent. */
    @Modifying
    @Query("delete from CommunityProposal p where p.proposer.id = :proposerId and p.status = 'PENDING'")
    void deletePendingOf(Long proposerId);
}
