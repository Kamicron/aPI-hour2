package com.apihour.backend.service;

import com.apihour.backend.model.Users;
import com.apihour.backend.repository.UsersRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    
    @Autowired
    private UsersRepository usersRepository;

    public Users createUser(Users user) {
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom ne peut pas être vide");
        }
        if (user.getEmail() == null || !user.getEmail().contains("@")) {
            throw new IllegalArgumentException("L'email doit être valide");
        }
        
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        return usersRepository.save(user);
    }

    public List<Users> getAllUsers() {
        logger.debug("Getting all users");
        List<Users> users = usersRepository.findAll();
        logger.debug("Found {} users", users.size());
        for (Users user : users) {
            logger.debug("User: id={}, name={}, email={}", user.getId(), user.getName(), user.getEmail());
        }
        return users;
    }

    public Optional<Users> getUserById(UUID id) {
        return usersRepository.findById(id);
    }
    
    public Users updateUser(UUID id, Users updatedUser) {
        return usersRepository.findById(id)
            .map(user -> {
                if (updatedUser.getName() != null) {
                    user.setName(updatedUser.getName());
                }
                if (updatedUser.getEmail() != null) {
                    user.setEmail(updatedUser.getEmail());
                }
                if (updatedUser.getPassword() != null) {
                    user.setPassword(updatedUser.getPassword());
                }
                if (updatedUser.getRole() != null) {
                    user.setRole(updatedUser.getRole());
                }
                if (updatedUser.getWeeklyHoursGoal() != null) {
                    user.setWeeklyHoursGoal(updatedUser.getWeeklyHoursGoal());
                }
                if (updatedUser.getWorkingDays() != null) {
                    user.setWorkingDays(updatedUser.getWorkingDays());
                }
                user.setUpdatedAt(new Date());
                return usersRepository.save(user);
            })
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
    }

    public boolean deleteUser(UUID id) {
        return usersRepository.findById(id)
            .map(user -> {
                user.setDeletedAt(new Date());
                usersRepository.save(user);
                return true;
            })
            .orElse(false);
    }
}
