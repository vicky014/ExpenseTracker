package com.expensetracker.controller;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            // Seed a default user for local testing if looking for id 1
            if (id == 1L) {
                User defaultUser = new User();
                defaultUser.setId(1L);
                defaultUser.setName("Vikram");
                defaultUser.setEmail("vikram@expensetracker.local");
                defaultUser.setCurrency("₹");
                defaultUser.setSavingsGoal(15000.0);
                User saved = userRepository.save(defaultUser);
                return ResponseEntity.ok(saved);
            }
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public User createOrUpdateUser(@RequestBody User user) {
        return userRepository.save(user);
    }
}
