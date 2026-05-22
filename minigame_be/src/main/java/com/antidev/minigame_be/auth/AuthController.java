package com.antidev.minigame_be.auth;

import com.antidev.minigame_be.auth.dto.AuthTokenResponse;
import com.antidev.minigame_be.auth.dto.GuestLoginRequest;
import com.antidev.minigame_be.config.AppSecurityProperties;
import com.antidev.minigame_be.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtService jwtService;
    private final AppSecurityProperties appSecurityProperties;

    @PostMapping("/guest-token")
    public AuthTokenResponse guestToken(@Valid @RequestBody GuestLoginRequest request) {
        String subject = request.nickname() + "@" + request.roomCode();
        String token = jwtService.generateToken(subject, Map.of(
            "nickname", request.nickname(),
            "roomCode", request.roomCode()
        ));
        return new AuthTokenResponse(token, "Bearer", appSecurityProperties.getJwtExpirationMinutes());
    }
}

