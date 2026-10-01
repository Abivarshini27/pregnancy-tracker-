package com.example.pregnancy_tracker.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.pregnancy_tracker.Entity.User;

public interface UserRepository extends JpaRepository<User,Long> {
    
    List<User> findAllByEmailOrderByIdDesc(String email);
}
