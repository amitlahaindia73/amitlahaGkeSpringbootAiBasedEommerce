/**
 * Centralized local environment configuration.
 *
 * Important local networking rule:
 * - browser-facing URLs must use localhost
 * - container-to-container server calls may use Docker service names or host.docker.internal when the backend runs on Kubernetes
 */
export const appConfig = {
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  gatewayBaseUrl: process.env.GATEWAY_BASE_URL || "http://api-gateway:8081",
  userServiceBaseUrl: process.env.USER_SERVICE_BASE_URL || "http://user-service:8082",
  keycloakPublicBaseUrl: process.env.KEYCLOAK_PUBLIC_BASE_URL || "http://localhost:8080",
  keycloakInternalBaseUrl: process.env.KEYCLOAK_INTERNAL_BASE_URL || "http://keycloak:8080",
  keycloakRealm: process.env.KEYCLOAK_REALM || "amitra-commerce",
  keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || "nextjs-bff",
  keycloakClientSecret=REDACTED || "nextjs-secret"
};

export function keycloakPublicRealmUrl() {
  return `${appConfig.keycloakPublicBaseUrl}/realms/${appConfig.keycloakRealm}`;
}

export function keycloakInternalRealmUrl() {
  return `${appConfig.keycloakInternalBaseUrl}/realms/${appConfig.keycloakRealm}`;
}
