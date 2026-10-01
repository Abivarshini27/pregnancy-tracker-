package com.example.pregnancy_tracker.Controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.example.pregnancy_tracker.Entity.PregnancyData;
import com.example.pregnancy_tracker.Repository.PregnancyDataRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@RestController
public class PregnancyDataController {
    private final PregnancyDataRepository pregnancyDataRepository;
    private final ObjectMapper objectMapper;

    public PregnancyDataController(PregnancyDataRepository pregnancyDataRepository, ObjectMapper objectMapper) {
        this.pregnancyDataRepository = pregnancyDataRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/tracker")
    public ResponseEntity<Map<String, Object>> getTrackerData(Authentication authentication) throws Exception {
        return pregnancyDataRepository.findByUserEmail(authentication.getName())
                .map(data -> readPayload(data.getPayload()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of()));
    }

    @PutMapping("/tracker")
    public ResponseEntity<Map<String, Object>> saveTrackerData(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) throws Exception {
        PregnancyData data = pregnancyDataRepository.findByUserEmail(authentication.getName())
                .orElseGet(PregnancyData::new);
        data.setUserEmail(authentication.getName());
        data.setPayload(objectMapper.writeValueAsString(payload));
        pregnancyDataRepository.save(data);
        return ResponseEntity.ok(payload);
    }

    private Map<String, Object> readPayload(String payload) {
        try {
            return objectMapper.readValue(payload, new TypeReference<>() {});
        } catch (Exception exception) {
            return Map.of();
        }
    }
}
