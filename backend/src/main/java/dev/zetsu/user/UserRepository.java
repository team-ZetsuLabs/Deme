package dev.zetsu.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    @Query("select t.name from User u join u.technologies t where u.id = :id")
    List<String> technologyNames(@Param("id") Long id);

    interface AccountState {
        UserStatus getStatus();

        Role getRole();
    }

    /** Lu à chaque requête authentifiée par ActiveAccountFilter : statut et rôle à jour. */
    @Query("select u.status as status, u.role as role from User u where u.id = :id")
    Optional<AccountState> findAccountState(@Param("id") Long id);

    /** Back office (MOD-4) : pseudo, nom ou email, plus récents d'abord. */
    @Query("""
            select u from User u
            where (:q is null or lower(u.username) like :q or lower(u.displayName) like :q or lower(u.email) like :q)
              and (:status is null or u.status = :status) and (:role is null or u.role = :role)
            order by u.createdAt desc, u.id desc""")
    Page<User> searchForAdmin(@Param("q") String likePattern, @Param("status") UserStatus status,
                              @Param("role") Role role, Pageable pageable);

    @Modifying(flushAutomatically = true)
    @Query(value = "update users set reputation = reputation + :delta where id = :id", nativeQuery = true)
    void addReputation(@Param("id") Long id, @Param("delta") int delta);
}
