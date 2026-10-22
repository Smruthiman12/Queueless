/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SPRING_BOOT_CONTROLLER_CODE = `
package com.queueless.backend.controller;

import com.queueless.backend.dto.*;
import com.queueless.backend.service.QueueOptimizationService;
import com.queueless.backend.service.TokenBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class QueueManagementController {

    @Autowired
    private TokenBookingService tokenBookingService;

    @Autowired
    private QueueOptimizationService queueOptimizationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // GET /api/facilities
    @GetMapping("/facilities")
    public ResponseEntity<List<FacilityDTO>> getAllFacilities() {
        return ResponseEntity.ok(tokenBookingService.getActiveFacilities());
    }

    // GET /api/counters/recommendation
    @GetMapping("/counters/recommendation")
    public ResponseEntity<CounterRecommendationDTO> getOptimalCounter(
            @RequestParam String facilityId,
            @RequestParam(defaultValue = "NORMAL") String priorityLevel) {
        CounterRecommendationDTO best = queueOptimizationService.calculateOptimalCounter(facilityId, priorityLevel);
        return ResponseEntity.ok(best);
    }

    // POST /api/tokens - Books a digital token (Java ArrayDeque / PriorityQueue sync)
    @PostMapping("/tokens")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TokenResponseDTO> bookToken(@RequestBody TokenBookingRequestDTO request) {
        TokenResponseDTO token = tokenBookingService.bookDigitalToken(request);
        // Broadcast WebSocket live update
        messagingTemplate.convertAndSend("/topic/queue/" + request.getCounterId(), token);
        return ResponseEntity.ok(token);
    }

    // POST /api/staff/tokens/{id}/call
    @PostMapping("/staff/tokens/{id}/call")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<TokenResponseDTO> callNextToken(
            @PathVariable("id") String tokenId,
            @RequestParam String counterId) {
        TokenResponseDTO called = tokenBookingService.callToken(tokenId, counterId);
        messagingTemplate.convertAndSend("/topic/student/" + called.getStudentId(), called);
        return ResponseEntity.ok(called);
    }

    // POST /api/staff/tokens/{id}/complete
    @PostMapping("/staff/tokens/{id}/complete")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Void> completeToken(
            @PathVariable("id") String tokenId,
            @RequestParam String counterId) {
        tokenBookingService.markServed(tokenId, counterId);
        return ResponseEntity.noContent().build();
    }
}
`;

export const SPRING_BOOT_DSA_SERVICE_CODE = `
package com.queueless.backend.service;

import com.queueless.backend.model.ServiceCounter;
import com.queueless.backend.model.Token;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DSA Queue Management Engine using ArrayDeque & PriorityQueue
 */
@Service
public class QueueOptimizationService {

    // Thread-safe in-memory FIFO queues per counter: ArrayDeque (O(1) push, pop, peek)
    private final Map<String, ArrayDeque<Token>> counterFifoQueues = new ConcurrentHashMap<>();

    // Priority Queue for accessibility and emergencies: PriorityQueue (O(log N))
    private final Map<String, PriorityQueue<Token>> counterPriorityQueues = new ConcurrentHashMap<>();

    private final Comparator<Token> priorityComparator = (a, b) -> {
        int weightCompare = Integer.compare(b.getPriority().getWeight(), a.getPriority().getWeight());
        if (weightCompare != 0) {
            return weightCompare;
        }
        // Tie-breaker: Preserve FIFO order for equal priority using arrival epoch
        return a.getBookingTime().compareTo(b.getBookingTime());
    };

    /**
     * Smart Counter Allocation Formula:
     * Estimated Wait W = R_curr + (N_ahead * S_avg)
     * R_curr: Remaining service time of active token
     * N_ahead: Active queue depth
     * S_avg: Average service velocity in seconds
     */
    public CounterRecommendationDTO calculateOptimalCounter(String facilityId, String priorityLevel) {
        List<ServiceCounter> counters = counterRepository.findByFacilityIdAndStatusIn(
                facilityId, List.of("OPEN", "BUSY")
        );

        ServiceCounter bestCounter = null;
        int minWaitTimeSeconds = Integer.MAX_VALUE;

        for (ServiceCounter counter : counters) {
            int queueLength = counterFifoQueues.getOrDefault(counter.getId(), new ArrayDeque<>()).size();
            int avgDuration = counter.getAvgServiceDurationSeconds();

            int remainingCurrent = 0;
            if (counter.getCurrentlyServingTokenId() != null && counter.getServingStartedAt() != null) {
                long elapsed = Instant.now().getEpochSecond() - counter.getServingStartedAt().getEpochSecond();
                remainingCurrent = (int) Math.max(0, avgDuration - elapsed);
            }

            int estimatedWait = remainingCurrent + (queueLength * avgDuration);

            // Tie breaker: shortest wait -> shortest queue -> lowest counter ID
            if (estimatedWait < minWaitTimeSeconds || 
               (estimatedWait == minWaitTimeSeconds && queueLength < bestCounter.getQueueLength())) {
                minWaitTimeSeconds = estimatedWait;
                bestCounter = counter;
            }
        }

        return new CounterRecommendationDTO(bestCounter, minWaitTimeSeconds);
    }
}
`;
