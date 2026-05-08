package com.apihour.backend.service;

import com.apihour.backend.model.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private List<User> users = new ArrayList<>();
    private Long nextId = 1L;

    public User createUser(String name, String email) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom ne peut pas être vide");
        }
        if (email == null || !email.contains("@")) {
            throw new IllegalArgumentException("L'email doit être valide");
        }
        
        User user = new User(nextId++, name, email);
        users.add(user);
        return user;
    }

    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }

    public Optional<User> getUserById(Long id) {
        return users.stream()
                .filter(u -> u.getId().equals(id))
                .findFirst();
    }

    public boolean deleteUser(Long id) {
        return users.removeIf(u -> u.getId().equals(id));
    }
}
