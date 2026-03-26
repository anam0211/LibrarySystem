package com.library.config;

import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        
        String currentDir = System.getProperty("user.dir");
    
        String path1 = Paths.get(currentDir, "..", "frontend").normalize().toUri().toString();
        String path2 = Paths.get(currentDir, "frontend").normalize().toUri().toString();

        registry.addResourceHandler("/**")
                .addResourceLocations(path1, path2, "classpath:/static/");
    }
}