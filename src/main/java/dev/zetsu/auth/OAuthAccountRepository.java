package dev.zetsu.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    @Query("select a from OAuthAccount a join fetch a.user where a.provider = :provider and a.providerUserId = :providerUserId")
    Optional<OAuthAccount> findWithUser(String provider, String providerUserId);
}
