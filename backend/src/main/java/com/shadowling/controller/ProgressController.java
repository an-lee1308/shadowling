package com.shadowling.controller;

import com.shadowling.dto.ApiResponse;
import com.shadowling.dto.progress.AnalyticsResponse;
import com.shadowling.dto.progress.DashboardResponse;
import com.shadowling.model.User;
import com.shadowling.repository.UserRepository;
import com.shadowling.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(progressService.getDashboard(userId)));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "30") int days) {

        UUID userId = resolveUserId(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(progressService.getAnalytics(userId, days)));
    }

    private UUID resolveUserId(String email) {
        return userRepository.findByEmail(email).map(User::getId).orElseThrow();
    }
}
