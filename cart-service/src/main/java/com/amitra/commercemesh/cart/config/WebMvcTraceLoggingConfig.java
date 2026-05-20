
package com.amitra.commercemesh.cart.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcTraceLoggingConfig implements WebMvcConfigurer {
    private final TraceRequestLoggingInterceptor traceRequestLoggingInterceptor;

    @Autowired
    public WebMvcTraceLoggingConfig(TraceRequestLoggingInterceptor traceRequestLoggingInterceptor) {
        this.traceRequestLoggingInterceptor = traceRequestLoggingInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(traceRequestLoggingInterceptor);
    }
}
