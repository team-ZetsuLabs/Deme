package dev.zetsu.user;

import dev.zetsu.answer.AnswerRepository;
import dev.zetsu.common.ApiException;
import dev.zetsu.common.PageResponse;
import dev.zetsu.question.QuestionRepository;
import dev.zetsu.reputation.ReputationDtos.ReputationEntry;
import dev.zetsu.reputation.ReputationService;
import dev.zetsu.user.UserDtos.Me;
import dev.zetsu.user.UserDtos.PublicProfile;
import dev.zetsu.user.UserDtos.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;
    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final ReputationService reputation;

    public UserService(UserRepository users, QuestionRepository questions, AnswerRepository answers,
                       ReputationService reputation) {
        this.users = users;
        this.questions = questions;
        this.answers = answers;
        this.reputation = reputation;
    }

    @Transactional(readOnly = true)
    public Me me(Long id) {
        return toMe(users.findById(id).orElseThrow(UserService::notFound));
    }

    public Me toMe(User u) {
        return Me.from(u, reputation.levelOf(u.getReputation()));
    }

    @Transactional(readOnly = true)
    public PublicProfile profile(String username) {
        User u = byUsername(username);
        return new PublicProfile(u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getBio(),
                u.getCountryCode(), u.getCity(), u.getRole(), u.getReputation(),
                reputation.levelOf(u.getReputation()), u.isVisibleToRecruiters(),
                questions.countByAuthorId(u.getId()), answers.countByAuthorId(u.getId()), u.getCreatedAt());
    }

    @Transactional
    public Me update(Long id, UpdateProfileRequest req) {
        User u = users.findById(id).orElseThrow(UserService::notFound);
        u.setDisplayName(req.displayName().trim());
        u.setBio(blankToNull(req.bio()));
        u.setCountryCode(blankToNull(req.countryCode()));
        u.setCity(blankToNull(req.city()));
        u.setLanguage(req.language());
        u.setVisibleToRecruiters(req.visibleToRecruiters());
        return toMe(u);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReputationEntry> reputationHistory(String username, int page, int size) {
        return reputation.history(byUsername(username).getId(), page, size);
    }

    private User byUsername(String username) {
        return users.findByUsernameIgnoreCase(username).orElseThrow(UserService::notFound);
    }

    private static ApiException notFound() {
        return ApiException.notFound("USER_NOT_FOUND", "Membre introuvable");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
