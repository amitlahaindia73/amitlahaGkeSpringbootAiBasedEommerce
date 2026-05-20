package com.amitra.commercemesh.notification.config;

import java.util.Arrays;
import java.util.stream.Collectors;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Central INFO-level application logging for important business flow methods.
 * Keeps existing logic unchanged and adds consistent entry/exit/error logging
 * across controllers, services, and filters.
 */
@Aspect
@Component
public class ApplicationLoggingAspect {

    private static final int MAX_VALUE_LENGTH = 400;
    private static final Logger log = LoggerFactory.getLogger(ApplicationLoggingAspect.class);

    @Around("within(com.amitra.commercemesh.notification..controller..*) || within(com.amitra.commercemesh.notification..service..*) || within(com.amitra.commercemesh.notification..filter..*)")
    public Object logAroundBusinessMethods(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();
        String arguments = Arrays.stream(joinPoint.getArgs())
                .map(this::safeValue)
                .collect(Collectors.joining(", "));

        log.info("Entering {} with args=[{}]", method, arguments);
        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Completed {} in {} ms with result=[{}]", method, duration, safeValue(result));
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Failed {} in {} ms: {}", method, duration, ex.getMessage(), ex);
            throw ex;
        }
    }

    private String safeValue(Object value) {
        if (value == null) {
            return "null";
        }
        String className = value.getClass().getName();
        if (className.startsWith("jakarta.servlet") || className.startsWith("org.springframework.http.server")
                || className.startsWith("org.springframework.web.server")
                || className.startsWith("reactor.core.publisher")) {
            return value.getClass().getSimpleName();
        }
        String text = String.valueOf(value).replaceAll("\\s+", " ").trim();
        return text.length() > MAX_VALUE_LENGTH ? text.substring(0, MAX_VALUE_LENGTH) + "..." : text;
    }
}
