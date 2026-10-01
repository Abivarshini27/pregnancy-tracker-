package com.example.pregnancy_tracker.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.pregnancy_tracker.Entity.User;
import com.example.pregnancy_tracker.Repository.UserRepository;

import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Object loginRequest;

    public User signup(User user) {
        if (!userRepository.findAllByEmailOrderByIdDesc(user.getEmail()).isEmpty()) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User login(String email, String password) {
        List<User> users = userRepository.findAllByEmailOrderByIdDesc(email);
        return users.stream()
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .findFirst()
                .orElse(null);
    }

    public User getUserByEmail(String email) {
        return userRepository.findAllByEmailOrderByIdDesc(email).stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
