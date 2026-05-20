package com.amitra.commercemesh.gateway.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Local-only helper endpoint to verify what the gateway actually receives after
 * Keycloak login. Useful for confirming customer/admin roles in real tokens.
 */
@RestController
public class TokenDebugController {

    @GetMapping("/debug/token")
    public Map<String, Object> token(Authentication authentication) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("authenticated", authentication != null && authentication.isAuthenticated());
        response.put("authorities", authentication == null ? null : authentication.getAuthorities());

        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            response.put("subject", jwt.getSubject());
            response.put("preferred_username", jwt.getClaimAsString("preferred_username"));
            response.put("email", jwt.getClaimAsString("email"));
            response.put("realm_access", jwt.getClaim("realm_access"));
            response.put("resource_access", jwt.getClaim("resource_access"));
        }

        return response;
    }
}
