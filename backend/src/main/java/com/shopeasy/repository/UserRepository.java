// ═══════════════════════════════════════════════════════════
//  ShopEasy — Spring Data JPA Repositories
//  Each interface in its own file in production;
//  combined here for readability.
// ═══════════════════════════════════════════════════════════

// ── UserRepository.java ──────────────────────────────────────────────────────
package com.shopeasy.repository;

import com.shopeasy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
