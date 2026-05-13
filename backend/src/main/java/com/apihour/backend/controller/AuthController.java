package com.apihour.backend.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.apihour.backend.config.JwtUtils;
import com.apihour.backend.model.Users;
import com.apihour.backend.repository.UsersRepository;
import com.apihour.backend.service.EmailService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

  private final UsersRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtils jwtUtils;
  private final AuthenticationManager authenticationManager;
  private final EmailService emailService;

  public AuthController(UsersRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils,
      AuthenticationManager authenticationManager, EmailService emailService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtils = jwtUtils;
    this.authenticationManager = authenticationManager;
    this.emailService = emailService;
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody Users user) {
    if (userRepository.findByEmail(user.getEmail()) != null) {
      return ResponseEntity.badRequest().body("Email already exists");
    }
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    user.setRole("user");
    Users savedUser = userRepository.save(user);

    try {
      emailService.sendWelcomeEmail(user.getEmail(), user.getName());
    } catch (Exception e) {
      logger.error("Failed to send welcome email to: {}", user.getEmail(), e);
    }

    return ResponseEntity.ok(savedUser);
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody Users user) {
    try {
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword()));
      if (authentication.isAuthenticated()) {
        Map<String, Object> authData = new HashMap<>();
        authData.put("token", jwtUtils.generateToken(user.getEmail()));
        authData.put("type", "Bearer");
        return ResponseEntity.ok(authData);
      }
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");

    } catch (BadCredentialsException e) {
      logger.warn("Invalid credentials for user: {}", user.getEmail());
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password");
    } catch (Exception e) {
      logger.error("Authentication error for user: {}", user.getEmail(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Authentication service unavailable");
    }
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    
    if (email == null || email.isEmpty()) {
      return ResponseEntity.badRequest().body("Email is required");
    }

    Users user = userRepository.findByEmail(email);
    
    if (user == null) {
      logger.info("Password reset requested for non-existent email: {}", email);
      return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent"));
    }

    String resetToken = UUID.randomUUID().toString();
    Date expiry = new Date(System.currentTimeMillis() + 3600000);
    
    user.setResetToken(resetToken);
    user.setResetTokenExpiry(expiry);
    userRepository.save(user);

    try {
      emailService.sendPasswordResetEmail(email, resetToken);
    } catch (Exception e) {
      logger.error("Failed to send password reset email to: {}", email, e);
    }

    return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent"));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
    String token = request.get("token");
    String newPassword = request.get("password");

    if (token == null || token.isEmpty() || newPassword == null || newPassword.isEmpty()) {
      return ResponseEntity.badRequest().body("Token and new password are required");
    }

    Users user = userRepository.findByResetToken(token);

    if (user == null) {
      return ResponseEntity.badRequest().body("Invalid or expired reset token");
    }

    if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().before(new Date())) {
      user.setResetToken(null);
      user.setResetTokenExpiry(null);
      userRepository.save(user);
      return ResponseEntity.badRequest().body("Reset token has expired");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    user.setResetToken(null);
    user.setResetTokenExpiry(null);
    userRepository.save(user);

    logger.info("Password successfully reset for user: {}", user.getEmail());

    return ResponseEntity.ok(Map.of("message", "Password successfully reset"));
  }

}
