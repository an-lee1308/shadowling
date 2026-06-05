package com.shadowling.service;

import com.shadowling.dto.auth.AuthResponse;
import com.shadowling.dto.auth.LoginRequest;
import com.shadowling.dto.auth.RegisterRequest;
import com.shadowling.dto.auth.UpdateProfileRequest;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);
        String token = tokenProvider.generateToken(user.getEmail());
        return toAuthResponse(token, user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = tokenProvider.generateToken(user.getEmail());
        return toAuthResponse(token, user);
    }

    @Transactional
    public AuthResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        if (request.getLevel() != null) user.setLevel(request.getLevel());
        if (request.getGoal() != null) user.setGoal(request.getGoal());
        if (request.getDailyGoalMinutes() != null) user.setDailyGoalMinutes(request.getDailyGoalMinutes());
        if (request.getPushSubscription() != null) user.setPushSubscription(request.getPushSubscription());

        user = userRepository.save(user);
        String token = tokenProvider.generateToken(user.getEmail());
        return toAuthResponse(token, user);
    }

    public AuthResponse getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String token = tokenProvider.generateToken(user.getEmail());
        return toAuthResponse(token, user);
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatar(user.getAvatar())
                .level(user.getLevel())
                .goal(user.getGoal())
                .streakCount(user.getStreakCount())
                .totalXp(user.getTotalXp())
                .role(user.getRole())
                .dailyGoalMinutes(user.getDailyGoalMinutes())
                .build();
    }
}
