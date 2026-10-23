package dev.zetsu.job;

import dev.zetsu.auth.ZetsuPrincipal;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.MarkdownRenderer;
import dev.zetsu.common.PageResponse;
import dev.zetsu.common.Paging;
import dev.zetsu.job.JobDtos.JobDetail;
import dev.zetsu.job.JobDtos.JobRequest;
import dev.zetsu.job.JobDtos.JobReviewRequest;
import dev.zetsu.job.JobDtos.JobSummary;
import dev.zetsu.job.JobDtos.MyApplicationRef;
import dev.zetsu.job.JobDtos.ReviewDecision;
import dev.zetsu.job.JobDtos.StackMatch;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.tag.Tag;
import dev.zetsu.tag.TagService;
import dev.zetsu.user.Role;
import dev.zetsu.user.User;
import dev.zetsu.user.UserDtos.AuthorSummary;
import dev.zetsu.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class JobService {

    private static final int MAX_TECHNOLOGIES = 10;

    private final JobRepository jobs;
    private final JobSearch search;
    private final ApplicationRepository applications;
    private final UserRepository users;
    private final TagService tags;
    private final MarkdownRenderer markdown;
    private final ReputationService reputation;

    public JobService(JobRepository jobs, JobSearch search, ApplicationRepository applications, UserRepository users,
                      TagService tags, MarkdownRenderer markdown, ReputationService reputation) {
        this.jobs = jobs;
        this.search = search;
        this.applications = applications;
        this.users = users;
        this.tags = tags;
        this.markdown = markdown;
        this.reputation = reputation;
    }

    @Transactional(readOnly = true)
    public PageResponse<JobSummary> list(JobSearch.Criteria criteria, int page, int size, ZetsuPrincipal me) {
        Paging.of(page, size);
        Set<String> stack = stackOf(me);
        return page(search.search(criteria, page, size), page, size, j -> toSummary(j, stack));
    }

    /** Liste sans correspondance de stack : celle du recruteur (« mes offres ») ou de la file de validation. */
    @Transactional(readOnly = true)
    public PageResponse<JobSummary> listForOwner(Long recruiterId, int page, int size) {
        Paging.of(page, size);
        var criteria = new JobSearch.Criteria(null, recruiterId, null, null, null, false);
        return page(search.search(criteria, page, size), page, size, j -> toSummary(j, Set.of()));
    }

    @Transactional(readOnly = true)
    public PageResponse<JobDetail> reviewQueue(JobStatus status, int page, int size, ZetsuPrincipal me) {
        Paging.of(page, size);
        var criteria = new JobSearch.Criteria(status, null, null, null, null, status == JobStatus.PENDING);
        return page(search.search(criteria, page, size), page, size, j -> toDetail(j, me));
    }

    @Transactional(readOnly = true)
    public JobDetail get(Long id, ZetsuPrincipal me) {
        return toDetail(loadVisible(id, me), me);
    }

    @Transactional
    public JobDetail create(JobRequest req, ZetsuPrincipal me) {
        User recruiter = users.findById(me.id()).orElseThrow();
        if (recruiter.getRole() != Role.RECRUITER && recruiter.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("RECRUITER_ONLY", "Seuls les recruteurs validés peuvent publier une offre");
        }
        Job job = new Job(recruiter);
        apply(job, req);
        jobs.saveAndFlush(job);
        return toDetail(job, me);
    }

    @Transactional
    public JobDetail update(Long id, JobRequest req, ZetsuPrincipal me) {
        Job job = loadOwned(id, me);
        if (job.getStatus() == JobStatus.CLOSED) {
            throw ApiException.conflict("JOB_CLOSED", "Cette offre est close");
        }
        apply(job, req);
        job.resubmit();
        jobs.saveAndFlush(job);
        return toDetail(job, me);
    }

    @Transactional
    public JobDetail close(Long id, ZetsuPrincipal me) {
        Job job = loadOwned(id, me);
        if (job.getStatus() != JobStatus.CLOSED) {
            job.close();
        }
        return toDetail(job, me);
    }

    @Transactional
    public JobDetail decide(Long id, JobReviewRequest req, ZetsuPrincipal me) {
        Job job = jobs.findDetailed(id).orElseThrow(JobService::notFound);
        if (job.getStatus() != JobStatus.PENDING) {
            throw ApiException.conflict("JOB_NOT_PENDING", "Cette offre n'est pas en attente de validation");
        }
        String reason = req.reason() == null || req.reason().isBlank() ? null : req.reason().trim();
        if (req.decision() == ReviewDecision.REJECT && reason == null) {
            throw ApiException.badRequest("REASON_REQUIRED", "Indiquez le motif du refus au recruteur");
        }
        job.review(req.decision() == ReviewDecision.APPROVE ? JobStatus.PUBLISHED : JobStatus.REJECTED,
                req.decision() == ReviewDecision.REJECT ? reason : null, me.id());
        return toDetail(job, me);
    }

    /** Une offre en attente ou refusée n'existe que pour son recruteur et l'équipe : 404 pour les autres. */
    Job loadVisible(Long id, ZetsuPrincipal me) {
        Job job = jobs.findDetailed(id).orElseThrow(JobService::notFound);
        boolean visible = job.getStatus() == JobStatus.PUBLISHED || job.getStatus() == JobStatus.CLOSED
                || isOwner(job, me) || isStaff(me);
        if (!visible) {
            throw notFound();
        }
        return job;
    }

    Job loadOwned(Long id, ZetsuPrincipal me) {
        Job job = loadVisible(id, me);
        if (!isOwner(job, me)) {
            throw ApiException.forbidden("NOT_JOB_OWNER", "Seul le recruteur de l'offre peut faire cela");
        }
        return job;
    }

    static boolean isOwner(Job job, ZetsuPrincipal me) {
        return me != null && job.getRecruiter().getId().equals(me.id());
    }

    static boolean isStaff(ZetsuPrincipal me) {
        return me != null && me.staff();
    }

    private void apply(Job job, JobRequest req) {
        job.setTitle(req.title().trim());
        job.setCompanyName(req.companyName().trim());
        job.setCompanyWebsite(blankToNull(req.companyWebsite()));
        job.setType(req.type());
        job.setCountryCode(blankToNull(req.countryCode()));
        job.setCity(blankToNull(req.city()));
        job.setTechnologies(tags.resolve(req.technologies(), 1, MAX_TECHNOLOGIES));
        job.setDescription(req.description(), markdown.toSafeHtml(req.description()));
        job.setCompensation(blankToNull(req.compensation()));
    }

    private <T> PageResponse<T> page(JobSearch.Result result, int page, int size, Function<Job, T> mapper) {
        Map<Long, Job> byId = result.ids().isEmpty() ? Map.of() : jobs.findAllDetailed(result.ids()).stream()
                .collect(Collectors.toMap(Job::getId, Function.identity()));
        List<T> items = result.ids().stream().map(byId::get).filter(j -> j != null).map(mapper).toList();
        return new PageResponse<>(items, page, size, result.total());
    }

    private Set<String> stackOf(ZetsuPrincipal me) {
        return me == null ? Set.of() : Set.copyOf(users.technologyNames(me.id()));
    }

    private JobSummary toSummary(Job j, Set<String> stack) {
        StackMatch match = match(j, stack);
        return new JobSummary(j.getId(), j.getTitle(), j.getCompanyName(), j.getType(), j.getCountryCode(), j.getCity(),
                names(j), j.getCompensation(), j.getStatus(), match == null ? null : match.percent(), j.getCreatedAt());
    }

    JobDetail toDetail(Job j, ZetsuPrincipal me) {
        boolean privileged = isOwner(j, me) || isStaff(me);
        MyApplicationRef mine = me == null ? null : applications.findByJobIdAndCandidateId(j.getId(), me.id())
                .map(a -> new MyApplicationRef(a.getId(), a.getStatus())).orElse(null);
        User r = j.getRecruiter();
        return new JobDetail(j.getId(), j.getTitle(), j.getCompanyName(), j.getCompanyWebsite(), j.getType(),
                j.getCountryCode(), j.getCity(), names(j), j.getDescriptionMarkdown(), j.getDescriptionHtml(),
                j.getCompensation(), j.getStatus(), privileged ? j.getRejectionReason() : null,
                AuthorSummary.from(r, reputation.levelOf(r.getReputation())), match(j, stackOf(me)), mine,
                privileged ? (int) applications.countByJobId(j.getId()) : null,
                isOwner(j, me) && j.getStatus() != JobStatus.CLOSED, j.getCreatedAt(), j.getUpdatedAt());
    }

    /** JOB-2 : technologies demandées que le membre a dans sa stack, dans l'ordre de l'offre. */
    static StackMatch match(Job j, Set<String> stack) {
        if (stack.isEmpty()) {
            return null;
        }
        List<String> wanted = names(j);
        List<String> matched = wanted.stream().filter(stack::contains).toList();
        List<String> missing = wanted.stream().filter(t -> !stack.contains(t)).toList();
        int percent = wanted.isEmpty() ? 0 : Math.round(100f * matched.size() / wanted.size());
        return new StackMatch(matched, missing, percent);
    }

    private static List<String> names(Job j) {
        return j.getTechnologies().stream().map(Tag::getName).toList();
    }

    private static ApiException notFound() {
        return ApiException.notFound("JOB_NOT_FOUND", "Offre introuvable");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
