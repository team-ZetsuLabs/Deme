package dev.zetsu.auth;

import dev.zetsu.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Connexion par email et mot de passe : l'identifiant de connexion est l'email. */
@Service
public class EmailUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    public EmailUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return users.findByEmailIgnoreCase(email)
                .filter(u -> u.getPasswordHash() != null)
                .map(ZetsuPrincipal::of)
                .orElseThrow(() -> new UsernameNotFoundException("Compte introuvable"));
    }
}
