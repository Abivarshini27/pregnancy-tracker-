package com.example.pregnancy_tracker.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pregnancy_tracker.Entity.PregnancyData;

public interface PregnancyDataRepository extends JpaRepository<PregnancyData, Long> {
    Optional<PregnancyData> findByUserEmail(String userEmail);
}
