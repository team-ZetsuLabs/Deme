package dev.zetsu.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    @Query("select a from OAuthAccount a join fetch a.user where a.provider = :provider and a.providerUserId = :providerUserId")
    Optional<OAuthAccount> findWithUser(String provider, String providerUserId);

    /** SET-4 : comptes GitHub et Google liés au membre. */
    @Query("select a from OAuthAccount a where a.user.id = :userId")
    List<OAuthAccount> findAllOf(@Param("userId") Long userId);

    @Modifying
    @Query("delete from OAuthAccount a where a.user.id = :userId and a.provider = :provider")
    int unlink(@Param("userId") Long userId, @Param("provider") String provider);

    @Modifying
    @Query("delete from OAuthAccount a where a.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
