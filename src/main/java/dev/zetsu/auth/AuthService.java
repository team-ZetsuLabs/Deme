package dev.zetsu.auth;

import dev.zetsu.common.ApiException;
import dev.zetsu.user.User;
import dev.zetsu.user.UserRepository;
import dev.zetsu.user.UsernameGenerator;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final UsernameGenerator usernames;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, UsernameGenerator usernames, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.usernames = usernames;
        this.passwordEncoder = passwordEncoder;
    }

    /** AUTH-1. Le pseudo, utilisé dans l'adresse du profil, est déduit du nom. */
    @Transactional
    public User register(AuthDtos.RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("EMAIL_TAKEN", "Cet email est déjà utilisé");
        }
        String displayName = req.displayName().trim();
        User user = new User(usernames.available(displayName), displayName);
        user.setEmail(email);
        user.setCountryCode(req.countryCode());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        try {
            return users.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // Deux inscriptions simultanées avec le même email.
            throw ApiException.conflict("EMAIL_TAKEN", "Cet email est déjà utilisé");
        }
    }
}
