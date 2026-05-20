package com.amitra.commercemesh.user.repository;

import com.amitra.commercemesh.user.domain.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUsername(String username);
    Optional<UserProfile> findByEmail(String email);
    Optional<UserProfile> findByExternalAuthId(String externalAuthId);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByExternalAuthId(String externalAuthId);
}
