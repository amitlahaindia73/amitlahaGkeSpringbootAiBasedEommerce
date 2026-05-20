package com.amitra.commercemesh.user.controller;

import com.amitra.commercemesh.security.UserContext;
import com.amitra.commercemesh.user.api.ApiResponse;
import com.amitra.commercemesh.user.domain.UserProfile;
import com.amitra.commercemesh.user.dto.UserProfileMeResponse;
import com.amitra.commercemesh.user.dto.UserProfileUpsertRequest;
import com.amitra.commercemesh.user.exception.ConflictException;
import com.amitra.commercemesh.user.exception.ResourceNotFoundException;
import com.amitra.commercemesh.user.repository.UserProfileRepository;
import com.amitra.commercemesh.user.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserProfileController {

    private final UserProfileRepository repository;
    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileRepository repository, UserProfileService userProfileService) {
        this.repository = repository;
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ApiResponse<List<UserProfile>> all(HttpServletRequest request) {
        return ApiResponse.success(repository.findAll(), "Users fetched successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileMeResponse> me(HttpServletRequest request) {
        UserProfile profile = userProfileService.getOrProvisionCurrentUser(new UserContext(request));
        return ApiResponse.success(UserProfileMeResponse.from(profile), "User profile fetched successfully", request.getHeader("X-Request-Id"));
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileMeResponse> updateMe(@Valid @RequestBody UserProfileUpsertRequest requestBody, HttpServletRequest request) {
        UserProfile profile = userProfileService.updateCurrentUser(new UserContext(request), requestBody);
        return ApiResponse.success(UserProfileMeResponse.from(profile), "User profile updated successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserProfile> byId(@PathVariable Long id, HttpServletRequest request) {
        UserProfile profile = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return ApiResponse.success(profile, "User fetched successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/username/{username}")
    public ApiResponse<UserProfile> byUsername(@PathVariable String username, HttpServletRequest request) {
        UserProfile profile = repository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return ApiResponse.success(profile, "User fetched successfully", request.getHeader("X-Request-Id"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserProfile>> create(@Valid @RequestBody UserProfileUpsertRequest requestBody, HttpServletRequest request) {
        if (repository.existsByUsername(requestBody.username())) {
            throw new ConflictException("Username already exists: " + requestBody.username());
        }
        if (repository.existsByEmail(requestBody.email())) {
            throw new ConflictException("Email already exists: " + requestBody.email());
        }
        UserProfile saved = repository.save(toEntity(new UserProfile(), requestBody));
        return ResponseEntity.ok(ApiResponse.success(saved, "User created successfully", request.getHeader("X-Request-Id")));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserProfile> update(@PathVariable Long id, @Valid @RequestBody UserProfileUpsertRequest requestBody, HttpServletRequest request) {
        UserProfile profile = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        repository.findByUsername(requestBody.username()).filter(existing -> !existing.getId().equals(id)).ifPresent(existing -> {
            throw new ConflictException("Username already exists: " + requestBody.username());
        });
        repository.findByEmail(requestBody.email()).filter(existing -> !existing.getId().equals(id)).ifPresent(existing -> {
            throw new ConflictException("Email already exists: " + requestBody.email());
        });
        UserProfile updated = repository.save(toEntity(profile, requestBody));
        return ApiResponse.success(updated, "User updated successfully", request.getHeader("X-Request-Id"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UserProfile toEntity(UserProfile profile, UserProfileUpsertRequest request) {
        profile.setUsername(request.username().trim());
        profile.setEmail(request.email().trim().toLowerCase());
        profile.setFullName(request.fullName().trim());
        profile.setPhoneNumber(trimToNull(request.phoneNumber()));
        profile.setAddressLine1(trimToNull(request.addressLine1()));
        profile.setAddressLine2(trimToNull(request.addressLine2()));
        profile.setCity(trimToNull(request.city()));
        profile.setState(trimToNull(request.state()));
        profile.setPostalCode(trimToNull(request.postalCode()));
        profile.setCountry(trimToNull(request.country()));
        return profile;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
