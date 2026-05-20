package com.amitra.commercemesh.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * When a downstream service is unavailable, the gateway can send callers here
 * instead of failing with a low-level exception.
 */
@RestController
public class FallbackController {

    @GetMapping("/fallback/default")
    public ResponseEntity<String> fallback() {
        return ResponseEntity.ok("Gateway fallback response: downstream service is temporarily unavailable.");
    }
}
