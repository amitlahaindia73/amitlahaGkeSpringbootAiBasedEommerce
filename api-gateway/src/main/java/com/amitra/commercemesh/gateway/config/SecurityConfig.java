package com.amitra.commercemesh.gateway.config;

import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.server.SecurityWebFilterChain;

import reactor.core.publisher.Mono;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                        .pathMatchers(
                                "/fallback/**",
                                "/actuator/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/webjars/**",
                                "/user-service/v3/api-docs",
                                "/product-service/v3/api-docs",
                                "/cart-service/v3/api-docs",
                                "/order-service/v3/api-docs",
                                "/payment-service/v3/api-docs",
                                "/delivery-service/v3/api-docs",
                                "/notification-service/v3/api-docs",
                                "/product-batch-service/v3/api-docs",
                                "/ai-recommendation-service/openapi.json",
                                "/ai-order-support-service/openapi.json"
                        ).permitAll()
                        .pathMatchers("/debug/token").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/products/viewed/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers(HttpMethod.GET, "/api/products/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                        .pathMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                        .pathMatchers("/api/cart/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/orders/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/payments/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/deliveries/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/notifications/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/users/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/recommendations/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/ai/**").hasAnyRole("CUSTOMER", "ADMIN")
                        .pathMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyExchange().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    public Converter<Jwt, Mono<JwtAuthenticationToken>> jwtAuthenticationConverter() {
        return new JwtAuthConverter();
    }

    static class JwtAuthConverter implements Converter<Jwt, Mono<JwtAuthenticationToken>> {
        @Override
        public Mono<JwtAuthenticationToken> convert(Jwt jwt) {
            return Mono.just(new JwtAuthenticationToken(jwt, extractAuthorities(jwt)));
        }

        private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
            Set<String> roles = new HashSet<>();
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> realmRoles) {
                realmRoles.forEach(role -> roles.add(toAuthority(role)));
            }
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                resourceAccess.values().forEach(value -> {
                    if (value instanceof Map<?, ?> clientMap) {
                        Object clientRolesObject = clientMap.get("roles");
                        if (clientRolesObject instanceof Collection<?> clientRoles) {
                            clientRoles.forEach(role -> roles.add(toAuthority(role)));
                        }
                    }
                });
            }
            return roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toSet());
        }

        private String toAuthority(Object role) {
            return "ROLE_" + String.valueOf(role).trim().toUpperCase();
        }
    }
}
