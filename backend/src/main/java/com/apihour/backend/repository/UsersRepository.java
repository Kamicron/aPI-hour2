package com.apihour.backend.repository;

import com.apihour.backend.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UsersRepository extends JpaRepository<Users, UUID> {

  Users findByEmail(String email);

  Users findByEmailIgnoreCase(String email);

  Users findByResetToken(String resetToken);
}
