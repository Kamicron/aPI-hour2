package com.apihour.backend.service;

import com.apihour.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Tests du service UserService")
class UserServiceTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService();
    }

    @Test
    @DisplayName("Devrait créer un utilisateur avec des données valides")
    void testCreateUser_WithValidData_ShouldCreateUser() {
        String name = "Jean Dupont";
        String email = "jean.dupont@example.com";

        User user = userService.createUser(name, email);

        assertNotNull(user);
        assertNotNull(user.getId());
        assertEquals(name, user.getName());
        assertEquals(email, user.getEmail());
    }

    @Test
    @DisplayName("Devrait lancer une exception si le nom est vide")
    void testCreateUser_WithEmptyName_ShouldThrowException() {
        String emptyName = "";
        String email = "test@example.com";

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.createUser(emptyName, email);
        });

        assertEquals("Le nom ne peut pas être vide", exception.getMessage());
    }

    @Test
    @DisplayName("Devrait lancer une exception si l'email est invalide")
    void testCreateUser_WithInvalidEmail_ShouldThrowException() {
        String name = "Jean Dupont";
        String invalidEmail = "invalidemail";

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.createUser(name, invalidEmail);
        });

        assertEquals("L'email doit être valide", exception.getMessage());
    }

    @Test
    @DisplayName("Devrait retourner tous les utilisateurs")
    void testGetAllUsers_ShouldReturnAllUsers() {
        userService.createUser("User 1", "user1@example.com");
        userService.createUser("User 2", "user2@example.com");

        List<User> users = userService.getAllUsers();

        assertEquals(2, users.size());
    }

    @Test
    @DisplayName("Devrait retourner un utilisateur par son ID")
    void testGetUserById_WithExistingId_ShouldReturnUser() {
        User createdUser = userService.createUser("Jean", "jean@example.com");

        Optional<User> foundUser = userService.getUserById(createdUser.getId());

        assertTrue(foundUser.isPresent());
        assertEquals(createdUser.getId(), foundUser.get().getId());
        assertEquals("Jean", foundUser.get().getName());
    }

    @Test
    @DisplayName("Devrait retourner Optional vide si l'ID n'existe pas")
    void testGetUserById_WithNonExistingId_ShouldReturnEmpty() {
        Optional<User> foundUser = userService.getUserById(999L);

        assertFalse(foundUser.isPresent());
    }

    @Test
    @DisplayName("Devrait supprimer un utilisateur existant")
    void testDeleteUser_WithExistingId_ShouldReturnTrue() {
        User user = userService.createUser("Jean", "jean@example.com");

        boolean deleted = userService.deleteUser(user.getId());

        assertTrue(deleted);
        assertEquals(0, userService.getAllUsers().size());
    }

    @Test
    @DisplayName("Devrait retourner false si l'utilisateur à supprimer n'existe pas")
    void testDeleteUser_WithNonExistingId_ShouldReturnFalse() {
        boolean deleted = userService.deleteUser(999L);

        assertFalse(deleted);
    }

    @Test
    @DisplayName("Devrait générer des IDs uniques pour chaque utilisateur")
    void testCreateUser_ShouldGenerateUniqueIds() {
        User user1 = userService.createUser("User 1", "user1@example.com");
        User user2 = userService.createUser("User 2", "user2@example.com");

        assertNotEquals(user1.getId(), user2.getId());
    }
}
