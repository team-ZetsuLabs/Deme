package dev.zetsu.project;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.notification.NotificationDtos.NotificationTarget;
import dev.zetsu.notification.NotificationService;
import dev.zetsu.notification.NotificationTargetType;
import dev.zetsu.notification.NotificationType;
import dev.zetsu.project.ProjectDtos.MyRequestRef;
import dev.zetsu.project.ProjectDtos.ProjectCreateRequest;
import dev.zetsu.project.ProjectDtos.ProjectDetail;
import dev.zetsu.project.ProjectDtos.ProjectEditRequest;
import dev.zetsu.project.ProjectDtos.ProjectSummary;
import dev.zetsu.project.ProjectDtos.RoleRequest;
import dev.zetsu.project.ProjectDtos.RoleView;
import dev.zetsu.project.ProjectDtos.TeamMember;
import dev.zetsu.project.ProjectDtos.UpdatePost;
import dev.zetsu.project.ProjectDtos.UpdateView;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.AccountDeleted;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Espace Projets (section 5) : publication, rôles, page du projet, fil de mises à jour, clôture. */
@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);

    /** PRJ-1 : de 1 à 6 rôles. Un membre par rôle : l'équipe tient donc sous la limite de 8, porteur compris. */
    public static final int MAX_ROLES = 6;
    /** Section 5.2 : 8 membres au plus, porteur compris. */
    static final int MAX_TEAM = 8;
    static final Duration INACTIVITY = Duration.ofDays(60);
    private static final int MAX_TECHNOLOGIES = 10;
    private static final int MAX_ROLE_TECHNOLOGIES = 5;

    private final ProjectRepository projects;
    private final ProjectSearch search;
    private final ProjectMemberRepository members;
    private final ProjectUpdateRepository updates;
    private final UserRepository users;
    private final TagService tags;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;
    private final NotificationService notifications;
    private Clock clock = Clock.systemUTC();

    public ProjectService(ProjectRepository projects, ProjectSearch search, ProjectMemberRepository members,
                          ProjectUpdateRepository updates, UserRepository users, TagService tags,
                          MarkdownRenderer markdown, ReputationService reputation,
                          NotificationService notifications) {
        this.projects = projects;
        this.search = search;
        this.members = members;
        this.updates = updates;
        this.users = users;
        this.tags = tags;
        this.markdown = markdown;
        this.reputation = reputation;
        this.notifications = notifications;
    }

    /** Pour les tests de la mise en pause. */
    void setClock(Clock clock) {
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectSummary> list(ProjectSearch.Criteria criteria, int page, int size) {
        Paging.of(page, size);
        ProjectSearch.Result result = search.search(criteria, page, size);
        if (result.ids().isEmpty()) {
            return new PageResponse<>(List.of(), page, size, result.total());
        }
        Map<Long, Project> byId = projects.findAllDetailed(result.ids()).stream()
                .collect(Collectors.toMap(Project::getId, Function.identity()));
        Map<Long, Long> accepted = new HashMap<>();
        for (Object[] row : members.countAcceptedByProjects(result.ids())) {
            accepted.put((Long) row[0], (Long) row[1]);
        }
        List<ProjectSummary> items = result.ids().stream().map(byId::get).filter(p -> p != null)
                .map(p -> toSummary(p, accepted.getOrDefault(p.getId(), 0L).intValue()))
                .toList();
        return new PageResponse<>(items, page, size, result.total());
    }

    @Transactional(readOnly = true)
    public ProjectDetail get(Long id, ZetsuPrincipal me) {
        return toDetail(loadVisible(id, me), me);
    }

    /** PRJ-1 : publié tout de suite, ouvert au recrutement. */
    @Transactional
    public ProjectDetail create(ProjectCreateRequest req, ZetsuPrincipal me) {
        Project p = new Project(users.getReferenceById(me.id()));
        apply(p, req.title(), req.description(), req.type(), req.technologies(), req.githubUrl(), req.contactUrl());
        for (RoleRequest role : req.roles()) {
            p.addRole(role.title().trim(), roleTechnologies(role));
        }
        projects.saveAndFlush(p);
        return toDetail(load(p.getId()), me);
    }

    @Transactional
    public ProjectDetail edit(Long id, ProjectEditRequest req, ZetsuPrincipal me) {
        Project p = loadOwnedActive(id, me);
        apply(p, req.title(), req.description(), req.type(), req.technologies(), req.githubUrl(), req.contactUrl());
        p.activity();
        projects.saveAndFlush(p);
        return toDetail(p, me);
    }

    @Transactional
    public ProjectDetail addRole(Long id, RoleRequest req, ZetsuPrincipal me) {
        Project p = loadOwnedActive(id, me);
        if (p.getRoles().size() >= MAX_ROLES) {
            throw ApiException.conflict("TOO_MANY_ROLES", MAX_ROLES + " rôles au plus par projet");
        }
        p.addRole(req.title().trim(), roleTechnologies(req));
        p.activity();
        projects.saveAndFlush(p);
        return toDetail(p, me);
    }

    /** Un rôle pourvu ne se retire pas : il faut d'abord retirer le membre. Les demandes en attente sont refusées. */
    @Transactional
    public ProjectDetail removeRole(Long id, Long roleId, ZetsuPrincipal me) {
        Project p = loadOwnedActive(id, me);
        ProjectRole role = role(p, roleId);
        if (!role.isOpen()) {
            throw ApiException.conflict("ROLE_FILLED", "Ce rôle est pourvu : retirez d'abord le membre");
        }
        for (ProjectMember pending : members.findByRoleIdAndStatus(roleId, MemberStatus.PENDING)) {
            pending.decide(MemberStatus.REFUSED);
            notifyDecision(pending, me);
        }
        p.removeRole(role);
        p.activity();
        projects.saveAndFlush(p);
        return toDetail(p, me);
    }

    /**
     * PRJ-6 : clôture définitive. Chaque membre accepté gagne 10 points, une seule fois ; le porteur n'en gagne pas,
     * pour qu'un projet ouvert et clôturé seul ne rapporte rien. Les demandes en attente sont refusées.
     */
    @Transactional
    public ProjectDetail close(Long id, ZetsuPrincipal me) {
        Project p = loadOwnedActive(id, me);
        p.close();
        for (ProjectMember m : members.findByProjectIdAndStatusOrderByDecidedAtAscIdAsc(p.getId(), MemberStatus.ACCEPTED)) {
            reputation.grantForProject(m.getUser().getId(), p.getId());
            notifications.notify(m.getUser().getId(), NotificationType.PROJECT_CLOSED, me.id(), target(p), null);
        }
        for (ProjectMember pending : members.findByProjectIdAndStatusOrderByDecidedAtAscIdAsc(p.getId(), MemberStatus.PENDING)) {
            pending.decide(MemberStatus.REFUSED);
            notifyDecision(pending, me);
        }
        projects.saveAndFlush(p);
        return toDetail(p, me);
    }

    @Transactional(readOnly = true)
    public PageResponse<UpdateView> updates(Long id, int page, int size, ZetsuPrincipal me) {
        Project p = loadVisible(id, me);
        return PageResponse.of(updates.findByProjectIdOrderByCreatedAtDescIdDesc(p.getId(), Paging.of(page, size)),
                u -> new UpdateView(u.getId(), author(u.getAuthor()), u.getText(), u.getCreatedAt()));
    }

    /** PRJ-5 : le porteur et les membres acceptés écrivent dans le fil, tant que le projet n'est pas clôturé. */
    @Transactional
    public UpdateView postUpdate(Long id, UpdatePost req, ZetsuPrincipal me) {
        Project p = loadVisible(id, me);
        if (!isTeamMember(p, me)) {
            throw ApiException.forbidden("NOT_PROJECT_MEMBER", "Seule l'équipe du projet peut écrire dans le fil");
        }
        requireNotClosed(p);
        ProjectUpdate u = updates.saveAndFlush(new ProjectUpdate(p.getId(), users.getReferenceById(me.id()),
                req.text().trim()));
        p.activity();
        User author = users.findById(me.id()).orElseThrow();
        return new UpdateView(u.getId(), author(author), u.getText(), u.getCreatedAt());
    }

    /** Section 5.2 : 60 jours sans activité, le projet passe « En pause ». Une fois par heure. */
    @Scheduled(fixedDelay = 1, timeUnit = java.util.concurrent.TimeUnit.HOURS)
    @Transactional
    public void pauseInactive() {
        int paused = projects.pauseInactiveSince(clock.instant().minus(INACTIVITY));
        if (paused > 0) {
            log.info("{} projet(s) mis en pause après {} jours sans activité", paused, INACTIVITY.toDays());
        }
    }

    /** AUTH-6 : un membre supprimé quitte ses équipes ; ses propres projets sont clôturés, sans points. */
    @EventListener
    public void onAccountDeleted(AccountDeleted event) {
        members.reopenRolesOf(event.userId());
        members.leaveAllOf(event.userId());
        projects.closeAllOf(event.userId());
    }

    public Project load(Long id) {
        return projects.findDetailed(id)
                .orElseThrow(() -> ApiException.notFound("PROJECT_NOT_FOUND", "Projet introuvable"));
    }

    /** Un projet masqué (MOD-2) n'existe que pour son porteur et l'équipe de modération : 404 pour les autres. */
    public Project loadVisible(Long id, ZetsuPrincipal me) {
        Project p = load(id);
        if (p.isHidden() && !isOwner(p, me) && !(me != null && me.staff())) {
            throw ApiException.notFound("PROJECT_NOT_FOUND", "Projet introuvable");
        }
        return p;
    }

    public Project loadOwned(Long id, ZetsuPrincipal me) {
        Project p = load(id);
        if (!isOwner(p, me)) {
            throw ApiException.forbidden("NOT_PROJECT_OWNER", "Seul le porteur du projet peut faire cela");
        }
        return p;
    }

    Project loadOwnedActive(Long id, ZetsuPrincipal me) {
        Project p = loadOwned(id, me);
        requireNotClosed(p);
        return p;
    }

    static void requireNotClosed(Project p) {
        if (p.getStatus() == ProjectStatus.CLOSED) {
            throw ApiException.conflict("PROJECT_CLOSED", "Ce projet est clôturé");
        }
    }

    static ProjectRole role(Project p, Long roleId) {
        return p.getRoles().stream().filter(r -> r.getId().equals(roleId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("ROLE_NOT_FOUND", "Rôle introuvable dans ce projet"));
    }

    public static boolean isOwner(Project p, ZetsuPrincipal me) {
        return me != null && p.getOwner().getId().equals(me.id());
    }

    boolean isTeamMember(Project p, ZetsuPrincipal me) {
        return isOwner(p, me) || (me != null && members.findFirstByProjectIdAndUserIdAndStatusIn(
                p.getId(), me.id(), List.of(MemberStatus.ACCEPTED)).isPresent());
    }

    void notifyDecision(ProjectMember m, ZetsuPrincipal me) {
        notifications.notify(m.getUser().getId(), NotificationType.PROJECT_REQUEST_DECIDED, me.id(),
                target(m.getProject()), m.getStatus().name());
    }

    static NotificationTarget target(Project p) {
        return NotificationService.target(NotificationTargetType.PROJECT, p.getId(), p.getTitle());
    }

    AuthorSummary author(User u) {
        return AuthorSummary.from(u, reputation.levelOf(u.getReputation()));
    }

    private void apply(Project p, String title, String description, ProjectType type, List<String> technologies,
                       String githubUrl, String contactUrl) {
        p.setTitle(title.trim());
        p.setDescription(description, markdown.toSafeHtml(description));
        p.setType(type);
        p.setTechnologies(tags.resolve(technologies, 0, MAX_TECHNOLOGIES));
        p.setLinks(blankToNull(githubUrl), blankToNull(contactUrl));
    }

    private List<Tag> roleTechnologies(RoleRequest role) {
        return new ArrayList<>(tags.resolve(role.technologies(), 0, MAX_ROLE_TECHNOLOGIES));
    }

    private static List<String> names(List<Tag> list) {
        return list.stream().map(Tag::getName).toList();
    }

    private ProjectSummary toSummary(Project p, int acceptedCount) {
        List<String> open = p.getRoles().stream().filter(ProjectRole::isOpen).map(ProjectRole::getTitle).toList();
        return new ProjectSummary(p.getId(), p.getTitle(), p.getType(), names(p.getTechnologies()), p.getStatus(),
                author(p.getOwner()), open, 1 + acceptedCount, p.getCreatedAt(), p.getLastActivityAt());
    }

    public ProjectDetail toDetail(Project p, ZetsuPrincipal me) {
        List<ProjectMember> accepted = members.findByProjectIdAndStatusOrderByDecidedAtAscIdAsc(p.getId(),
                MemberStatus.ACCEPTED);
        Map<Long, ProjectMember> byRole = new HashMap<>();
        List<TeamMember> team = new ArrayList<>();
        team.add(new TeamMember(author(p.getOwner()), null, true, p.getCreatedAt()));
        for (ProjectMember m : accepted) {
            if (m.getRole() != null) {
                byRole.put(m.getRole().getId(), m);
            }
            team.add(new TeamMember(author(m.getUser()), m.getRoleTitle(), false, m.getDecidedAt()));
        }
        List<RoleView> roles = p.getRoles().stream().map(r -> {
            ProjectMember holder = byRole.get(r.getId());
            return new RoleView(r.getId(), r.getTitle(), names(r.getTechnologies()), r.getStatus(),
                    holder == null ? null : author(holder.getUser()));
        }).toList();
        MyRequestRef mine = me == null ? null
                : members.findFirstByProjectIdAndUserIdOrderByCreatedAtDescIdDesc(p.getId(), me.id())
                .map(m -> new MyRequestRef(m.getId(), m.getRole() == null ? null : m.getRole().getId(), m.getStatus()))
                .orElse(null);
        boolean active = p.getStatus() != ProjectStatus.CLOSED;
        boolean teamMember = isOwner(p, me) || (mine != null && mine.status() == MemberStatus.ACCEPTED);
        return new ProjectDetail(p.getId(), p.getTitle(), p.getDescriptionMarkdown(), p.getDescriptionHtml(),
                p.getType(), names(p.getTechnologies()), p.getGithubUrl(), p.getContactUrl(), p.getStatus(),
                author(p.getOwner()), roles, team, mine, isOwner(p, me) && active, teamMember && active,
                p.getCreatedAt(), p.getUpdatedAt(), p.getLastActivityAt());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
