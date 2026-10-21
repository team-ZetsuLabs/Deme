package dev.zetsu.auth;

import dev.zetsu.common.ApiException;
import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(AuthDtos.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("EMAIL_TAKEN", "Cet email est déjà utilisé");
        }
        if (users.existsByUsernameIgnoreCase(req.username())) {
            throw ApiException.conflict("USERNAME_TAKEN", "Ce pseudo est déjà pris");
        }
        User user = new User(req.username(), req.displayName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        try {
            return users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // Deux inscriptions simultanées avec le même email ou pseudo.
            throw ApiException.conflict("ACCOUNT_TAKEN", "Cet email ou ce pseudo est déjà utilisé");
        }
    }
}
