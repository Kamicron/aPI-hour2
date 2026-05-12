package com.apihour.backend.controller;

import java.util.HashMap;
import java.util.Map;

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

  public AuthController(UsersRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils,
      AuthenticationManager authenticationManager) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtUtils = jwtUtils;
    this.authenticationManager = authenticationManager;
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody Users user) {
    if (userRepository.findByEmail(user.getEmail()) != null) {
      return ResponseEntity.badRequest().body("Email already exists");
    }
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    user.setRole("user");
    return ResponseEntity.ok(userRepository.save(user));
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

}
