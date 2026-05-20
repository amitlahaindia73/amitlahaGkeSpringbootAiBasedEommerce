package com.amitra.commercemesh.security;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;
import java.util.List;

public class UserContext {

    private final HttpServletRequest request;

    public UserContext(HttpServletRequest request) {
        this.request = request;
    }

    public String getUserId() {
        return request.getHeader(AuthHeaders.USER_ID);
    }

    public String getEmail() {
        return request.getHeader(AuthHeaders.EMAIL);
    }

    public String getUsername() {
        return request.getHeader(AuthHeaders.USERNAME);
    }

    public String getFullName() {
        return request.getHeader(AuthHeaders.FULL_NAME);
    }

    public List<String> getRoles() {
        String raw = request.getHeader(AuthHeaders.ROLES);
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.asList(raw.split(","));
    }

    public boolean isAuthenticated() {
        return getUserId() != null && !getUserId().isBlank();
    }
}