package com.amitra.commercemesh.user.service;

import com.amitra.commercemesh.security.UserContext;
import com.amitra.commercemesh.user.domain.UserProfile;
import com.amitra.commercemesh.user.dto.UserProfileUpsertRequest;
import com.amitra.commercemesh.user.exception.ConflictException;
import com.amitra.commercemesh.user.exception.ResourceNotFoundException;
import com.amitra.commercemesh.user.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserProfileRepository repository;

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public UserProfile getOrProvisionCurrentUser(UserContext userContext) {
        String externalAuthId = normalize(userContext.getUserId());
        String email = normalizeEmail(userContext.getEmail());
        String username = normalize(userContext.getUsername());
        String fullNameFromContext = normalize(userContext.getFullName());

        if (externalAuthId == null) {
            throw new ResourceNotFoundException("Authenticated user context is missing");
        }

        UserProfile profile = repository.findByExternalAuthId(externalAuthId)
                .or(() -> email == null ? java.util.Optional.empty() : repository.findByEmail(email))
                .orElseGet(UserProfile::new);

        boolean changed = false;

        if (profile.getId() == null) {
            profile.setExternalAuthId(externalAuthId);
            profile.setEmail(email != null ? email : externalAuthId + "@unknown.local");
            profile.setUsername(resolveUsername(username, email, externalAuthId));
            profile.setFullName(resolveDefaultFullName(fullNameFromContext, username, email));
            changed = true;
        } else {
            if (!hasText(profile.getExternalAuthId())) {
                profile.setExternalAuthId(externalAuthId);
                changed = true;
            }
            if (email != null && !email.equalsIgnoreCase(profile.getEmail())) {
                ensureEmailAvailable(email, profile.getId());
                profile.setEmail(email);
                changed = true;
            }
            if (username != null && !username.equalsIgnoreCase(profile.getUsername())) {
                ensureUsernameAvailable(username, profile.getId());
                profile.setUsername(username);
                changed = true;
            }
            if (!hasText(profile.getFullName())) {
                profile.setFullName(resolveDefaultFullName(fullNameFromContext, username, email));
                changed = true;
            } else if (shouldReplaceEmailLikeFullName(profile.getFullName(), email) && hasText(fullNameFromContext)) {
                profile.setFullName(fullNameFromContext);
                changed = true;
            }
        }

        return changed ? repository.save(profile) : profile;
    }

    @Transactional
    public UserProfile updateCurrentUser(UserContext userContext, UserProfileUpsertRequest request) {
        UserProfile profile = getOrProvisionCurrentUser(userContext);

        String username = normalize(request.username());
        String email = normalizeEmail(request.email());
        String fullName = normalize(request.fullName());

        ensureUsernameAvailable(username, profile.getId());
        ensureEmailAvailable(email, profile.getId());

        profile.setExternalAuthId(normalize(userContext.getUserId()));
        profile.setUsername(username);
        profile.setEmail(email);
        profile.setFullName(fullName);
        profile.setPhoneNumber(normalizeNullable(request.phoneNumber()));
        profile.setAddressLine1(normalizeNullable(request.addressLine1()));
        profile.setAddressLine2(normalizeNullable(request.addressLine2()));
        profile.setCity(normalizeNullable(request.city()));
        profile.setState(normalizeNullable(request.state()));
        profile.setPostalCode(normalizeNullable(request.postalCode()));
        profile.setCountry(normalizeNullable(request.country()));

        return repository.save(profile);
    }

    private void ensureUsernameAvailable(String username, Long currentId) {
        repository.findByUsername(username)
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(existing -> { throw new ConflictException("Username already exists: " + username); });
    }

    private void ensureEmailAvailable(String email, Long currentId) {
        repository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(existing -> { throw new ConflictException("Email already exists: " + email); });
    }

    private String resolveUsername(String username, String email, String externalAuthId) {
        String candidate = username != null ? username : email != null ? email.split("@")[0] : "user-" + externalAuthId.substring(0, Math.min(12, externalAuthId.length()));
        String base = candidate.trim();
        String next = base;
        int counter = 1;
        while (repository.existsByUsername(next)) {
            next = base + "-" + counter++;
        }
        return next;
    }

    private String resolveDefaultFullName(String fullName, String username, String email) {
        String source = fullName != null ? fullName : username != null ? username : email != null ? email.split("@")[0] : "Customer";
        return source.replace('.', ' ').replace('_', ' ').trim();
    }

    private boolean shouldReplaceEmailLikeFullName(String currentFullName, String email) {
        if (!hasText(currentFullName)) {
            return false;
        }
        String trimmed = currentFullName.trim();
        return trimmed.contains("@") && email != null && trimmed.equalsIgnoreCase(email);
    }

    private String normalize(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private String normalizeEmail(String value) {
        return hasText(value) ? value.trim().toLowerCase() : null;
    }

    private String normalizeNullable(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
