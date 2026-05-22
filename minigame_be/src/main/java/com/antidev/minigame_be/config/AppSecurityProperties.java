package com.antidev.minigame_be.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

    @NotBlank
    private String jwtSecret;

    @Min(1)
    private long jwtExpirationMinutes;

    @NotBlank
    private String allowedOrigins;
}

