package com.temi.stamprally.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addViewControllers(ViewControllerRegistry registry) {
    registry.addRedirectViewController("/mobile", "/mobile/index.html");
    registry.addRedirectViewController("/mobile/", "/mobile/index.html");
    registry.addRedirectViewController("/temi", "/temi/index.html");
    registry.addRedirectViewController("/temi/", "/temi/index.html");
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins("*")
        .allowedMethods("GET", "POST", "PUT", "OPTIONS")
        .allowedHeaders("*")
        .maxAge(3600);
  }
}
