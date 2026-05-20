package com.amitra.commercemesh.gateway.filter;

import com.amitra.commercemesh.security.AuthHeaders;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;

@Component
public class UserContextGatewayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .cast(JwtAuthenticationToken.class)
                .flatMap(jwtAuth -> {
                    Jwt jwt = jwtAuth.getToken();

                    String userId = safe(jwt.getSubject());
                    String email = safe(jwt.getClaimAsString("email"));
                    String username = safe(jwt.getClaimAsString("preferred_username"));
                    String fullName = resolveFullName(jwt, username, email);
                    String roles = jwtAuth.getAuthorities()
                            .stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.joining(","));

                    ServerWebExchange mutatedExchange = exchange.mutate()
                            .request(exchange.getRequest().mutate()
                                    .header(AuthHeaders.USER_ID, userId)
                                    .header(AuthHeaders.EMAIL, email)
                                    .header(AuthHeaders.USERNAME, username)
                                    .header(AuthHeaders.FULL_NAME, fullName)
                                    .header(AuthHeaders.ROLES, roles)
                                    .build())
                            .build();

                    return chain.filter(mutatedExchange);
                })
                .switchIfEmpty(chain.filter(exchange));
    }


    private String resolveFullName(Jwt jwt, String username, String email) {
        String name = safe(jwt.getClaimAsString("name"));
        if (!name.isBlank()) {
            return name;
        }

        String givenName = safe(jwt.getClaimAsString("given_name"));
        String familyName = safe(jwt.getClaimAsString("family_name"));
        String combined = (givenName + " " + familyName).trim();
        if (!combined.isBlank()) {
            return combined;
        }

        if (username != null && !username.isBlank()) {
            return username;
        }

        return email == null ? "" : email;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    @Override
    public int getOrder() {
        return -1;
    }
}