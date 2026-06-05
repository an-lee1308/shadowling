package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.gamification.LeaderboardEntryDto;
import com.shadowling.dto.gamification.XpStatusResponse;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;
    private final UserRepository userRepository;

    @GetMapping("/xp")
    public ResponseEntity<ApiResponse<XpStatusResponse>> getXpStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(gamificationService.getXpStatus(userId)));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<LeaderboardEntryDto>>> getLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(gamificationService.getLeaderboard(Math.min(limit, 50))));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
