package com.amitra.commercemesh.user.dto;

import com.amitra.commercemesh.user.domain.UserProfile;

public record UserProfileMeResponse(
        Long id,
        String username,
        String email,
        String fullName,
        String externalAuthId,
        String phoneNumber,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean profileComplete
) {
    public static UserProfileMeResponse from(UserProfile profile) {
        return new UserProfileMeResponse(
                profile.getId(),
                profile.getUsername(),
                profile.getEmail(),
                profile.getFullName(),
                profile.getExternalAuthId(),
                profile.getPhoneNumber(),
                profile.getAddressLine1(),
                profile.getAddressLine2(),
                profile.getCity(),
                profile.getState(),
                profile.getPostalCode(),
                profile.getCountry(),
                profile.isProfileComplete()
        );
    }
}
