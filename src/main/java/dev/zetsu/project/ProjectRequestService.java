package dev.zetsu.project;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.project.ProjectDtos.JoinRequest;
import dev.zetsu.project.ProjectDtos.MyRequest;
import dev.zetsu.project.ProjectDtos.ProjectDetail;
import dev.zetsu.project.ProjectDtos.ReceivedRequest;
import dev.zetsu.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Demandes pour rejoindre un projet et vie de l'équipe (PRJ-3, PRJ-4, section 5.2). */
@Service
public class ProjectRequestService {

    private final ProjectService projectService;
    private final ProjectMemberRepository members;
    private final UserRepository users;
    private final NotificationService notifications;

    public ProjectRequestService(ProjectService projectService, ProjectMemberRepository members, UserRepository users,
                                 NotificationService notifications) {
        this.projectService = projectService;
        this.members = members;
        this.users = users;
        this.notifications = notifications;
    }

    /** PRJ-3 : un rôle précis, avec un message ; une seule demande en attente par membre et par projet. */
    @Transactional
    public MyRequest request(Long projectId, JoinRequest req, ZetsuPrincipal me) {
        Project p = projectService.loadVisible(projectId, me);
        if (ProjectService.isOwner(p, me)) {
            throw ApiException.forbidden("CANNOT_JOIN_OWN", "Le porteur ne peut pas se porter candidat");
        }
        if (p.getStatus() != ProjectStatus.OPEN) {
            throw ApiException.conflict("PROJECT_NOT_OPEN", "Ce projet ne recrute pas en ce moment");
        }
        ProjectRole role = ProjectService.role(p, req.roleId());
        if (!role.isOpen()) {
            throw roleFilled();
        }
        members.findFirstByProjectIdAndUserIdAndStatusIn(p.getId(), me.id(),
                List.of(MemberStatus.PENDING, MemberStatus.ACCEPTED)).ifPresent(existing -> {
            throw existing.getStatus() == MemberStatus.ACCEPTED
                    ? ApiException.conflict("ALREADY_MEMBER", "Vous faites déjà partie de l'équipe")
                    : ApiException.conflict("ALREADY_REQUESTED", "Vous avez déjà une demande en attente sur ce projet");
        });
        ProjectMember m;
        try {
            m = members.saveAndFlush(new ProjectMember(p, users.getReferenceById(me.id()), role, req.message().trim()));
        } catch (DataIntegrityViolationException e) {
            // Deux demandes envoyées en même temps : l'index unique tranche.
            throw ApiException.conflict("ALREADY_REQUESTED", "Vous avez déjà une demande en attente sur ce projet");
        }
        notifications.notify(p.getOwner().getId(), NotificationType.PROJECT_REQUEST_RECEIVED, me.id(),
                ProjectService.target(p), null);
        return toMine(m);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReceivedRequest> received(Long projectId, MemberStatus status, int page, int size,
                                                  ZetsuPrincipal me) {
        Project p = projectService.loadOwned(projectId, me);
        return PageResponse.of(members.findReceived(p.getId(), status, Paging.of(page, size)), this::toReceived);
    }

    /**
     * PRJ-4 : le porteur accepte ou refuse, le candidat est notifié. Accepté, le rôle passe « Pourvu » et les
     * autres demandes en attente sur ce rôle sont refusées.
     */
    @Transactional
    public ReceivedRequest decide(Long projectId, Long requestId, MemberStatus decision, ZetsuPrincipal me) {
        if (decision != MemberStatus.ACCEPTED && decision != MemberStatus.REFUSED) {
            throw ApiException.badRequest("INVALID_STATUS", "Statut attendu : ACCEPTED ou REFUSED");
        }
        Project p = projectService.loadOwnedActive(projectId, me);
        ProjectMember m = members.findByIdAndProjectId(requestId, p.getId())
                .orElseThrow(ProjectRequestService::requestNotFound);
        if (m.getStatus() != MemberStatus.PENDING) {
            throw ApiException.conflict("REQUEST_NOT_PENDING", "Cette demande a déjà reçu une réponse");
        }
        if (decision == MemberStatus.ACCEPTED) {
            if (m.getRole() == null || !m.getRole().isOpen()) {
                throw roleFilled();
            }
            if (1 + members.countByProjectIdAndStatus(p.getId(), MemberStatus.ACCEPTED) >= ProjectService.MAX_TEAM) {
                throw ApiException.conflict("TEAM_FULL", "L'équipe compte déjà " + ProjectService.MAX_TEAM + " membres");
            }
        }
        m.decide(decision);
        projectService.notifyDecision(m, me);
        if (decision == MemberStatus.ACCEPTED) {
            for (ProjectMember other : members.findByRoleIdAndStatus(m.getRole().getId(), MemberStatus.PENDING)) {
                if (!other.getId().equals(m.getId())) {
                    other.decide(MemberStatus.REFUSED);
                    projectService.notifyDecision(other, me);
                }
            }
        }
        p.activity();
        members.flush();
        return toReceived(m);
    }

    /** Le candidat retire sa demande tant qu'elle est en attente. */
    @Transactional
    public void withdraw(Long projectId, Long requestId, ZetsuPrincipal me) {
        ProjectMember m = members.findByIdAndProjectId(requestId, projectId)
                .orElseThrow(ProjectRequestService::requestNotFound);
        if (!m.getUser().getId().equals(me.id())) {
            throw ApiException.forbidden("NOT_REQUEST_AUTHOR", "Seul l'auteur de la demande peut la retirer");
        }
        if (m.getStatus() != MemberStatus.PENDING) {
            throw ApiException.conflict("REQUEST_NOT_PENDING", "Cette demande a déjà reçu une réponse");
        }
        members.delete(m);
    }

    /** Comme {@link #withdraw}, sans connaître l'identifiant : la demande en attente du membre sur ce projet. */
    @Transactional
    public void withdrawMine(Long projectId, ZetsuPrincipal me) {
        ProjectMember m = members.findFirstByProjectIdAndUserIdAndStatusIn(projectId, me.id(),
                List.of(MemberStatus.PENDING)).orElseThrow(ProjectRequestService::requestNotFound);
        members.delete(m);
    }

    /** Section 5.2 : un membre peut quitter le projet ; son rôle se rouvre. */
    @Transactional
    public ProjectDetail leave(Long projectId, ZetsuPrincipal me) {
        Project p = projectService.loadVisible(projectId, me);
        ProjectService.requireNotClosed(p);
        ProjectMember m = members.findFirstByProjectIdAndUserIdAndStatusIn(p.getId(), me.id(),
                        List.of(MemberStatus.ACCEPTED))
                .orElseThrow(() -> ApiException.conflict("NOT_PROJECT_MEMBER", "Vous ne faites pas partie de l'équipe"));
        m.leave(null);
        p.activity();
        members.flush();
        return projectService.toDetail(p, me);
    }

    /** Section 5.2 : le porteur retire un membre avec un motif, que le membre retrouve sur sa demande. */
    @Transactional
    public ProjectDetail remove(Long projectId, String username, String reason, ZetsuPrincipal me) {
        Project p = projectService.loadOwnedActive(projectId, me);
        ProjectMember m = members.findByProjectIdAndStatusOrderByDecidedAtAscIdAsc(p.getId(), MemberStatus.ACCEPTED)
                .stream().filter(a -> a.getUser().getUsername().equalsIgnoreCase(username)).findFirst()
                .orElseThrow(() -> ApiException.notFound("MEMBER_NOT_FOUND", "Ce membre ne fait pas partie de l'équipe"));
        m.leave(reason.trim());
        p.activity();
        members.flush();
        notifications.notify(m.getUser().getId(), NotificationType.PROJECT_MEMBER_REMOVED, me.id(),
                ProjectService.target(p), null);
        return projectService.toDetail(p, me);
    }

    @Transactional(readOnly = true)
    public PageResponse<MyRequest> mine(int page, int size, ZetsuPrincipal me) {
        return PageResponse.of(members.findByUserIdOrderByCreatedAtDescIdDesc(me.id(), Paging.of(page, size)),
                this::toMine);
    }

    private ReceivedRequest toReceived(ProjectMember m) {
        return new ReceivedRequest(m.getId(), m.getRole() == null ? null : m.getRole().getId(), m.getRoleTitle(),
                projectService.author(m.getUser()), m.getMessage(), m.getStatus(), m.getCreatedAt(), m.getDecidedAt());
    }

    private MyRequest toMine(ProjectMember m) {
        return new MyRequest(m.getId(), m.getProject().getId(), m.getProject().getTitle(),
                m.getRole() == null ? null : m.getRole().getId(), m.getRoleTitle(),
                m.getMessage(), m.getStatus(), m.getRemovalReason(), m.getCreatedAt(), m.getDecidedAt(), m.getLeftAt());
    }

    private static ApiException roleFilled() {
        return ApiException.conflict("ROLE_FILLED", "Ce rôle est déjà pourvu");
    }

    private static ApiException requestNotFound() {
        return ApiException.notFound("REQUEST_NOT_FOUND", "Demande introuvable");
    }
}
