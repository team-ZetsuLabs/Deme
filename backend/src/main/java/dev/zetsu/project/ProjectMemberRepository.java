package dev.zetsu.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    @EntityGraph(attributePaths = {"user", "role", "project"})
    Optional<ProjectMember> findByIdAndProjectId(Long id, Long projectId);

    Optional<ProjectMember> findFirstByProjectIdAndUserIdAndStatusIn(Long projectId, Long userId,
                                                                    Collection<MemberStatus> statuses);

    /** Dernière demande du membre sur ce projet, pour la page du projet. */
    Optional<ProjectMember> findFirstByProjectIdAndUserIdOrderByCreatedAtDescIdDesc(Long projectId, Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<ProjectMember> findByProjectIdAndStatusOrderByDecidedAtAscIdAsc(Long projectId, MemberStatus status);

    @EntityGraph(attributePaths = {"user"})
    List<ProjectMember> findByRoleIdAndStatus(Long roleId, MemberStatus status);

    @EntityGraph(attributePaths = {"user"})
    @Query("select m from ProjectMember m where m.project.id = :projectId and (:status is null or m.status = :status)"
            + " order by m.createdAt desc, m.id desc")
    Page<ProjectMember> findReceived(@Param("projectId") Long projectId, @Param("status") MemberStatus status,
                                     Pageable pageable);

    @EntityGraph(attributePaths = {"project"})
    Page<ProjectMember> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);

    long countByProjectIdAndStatus(Long projectId, MemberStatus status);

    /** Membres acceptés par projet, pour la taille de l'équipe dans les listes : lignes [projectId, count]. */
    @Query("select m.project.id, count(m) from ProjectMember m where m.project.id in :ids and m.status = 'ACCEPTED'"
            + " group by m.project.id")
    List<Object[]> countAcceptedByProjects(@Param("ids") Collection<Long> ids);

    /** AUTH-6 : un membre supprimé quitte ses équipes (le rôle se rouvre) et ses demandes en attente tombent. */
    @Modifying
    @Query(value = """
            update project_roles set status = 'OPEN' where id in (
                select role_id from project_members where user_id = :userId and status = 'ACCEPTED')""",
            nativeQuery = true)
    void reopenRolesOf(@Param("userId") Long userId);

    @Modifying
    @Query(value = """
            update project_members set status = case status when 'ACCEPTED' then 'LEFT' else 'REFUSED' end,
                   left_at = case status when 'ACCEPTED' then now() end,
                   decided_at = coalesce(decided_at, now())
            where user_id = :userId and status in ('PENDING', 'ACCEPTED')""", nativeQuery = true)
    void leaveAllOf(@Param("userId") Long userId);
}
