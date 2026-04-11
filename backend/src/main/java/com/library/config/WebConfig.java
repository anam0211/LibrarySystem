package com.library.config;

import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String currentDir = System.getProperty("user.dir");
    
        String path1 = Paths.get(currentDir, "..", "frontend").normalize().toUri().toString();
        if (!path1.endsWith("/")) {
            path1 += "/"; 
        }
        String path2 = Paths.get(currentDir, "frontend").normalize().toUri().toString();
        if (!path2.endsWith("/")) {
            path2 += "/"; 
        }
        registry.addResourceHandler("/**")
                .addResourceLocations(path1, path2, "classpath:/static/");
    }
}
