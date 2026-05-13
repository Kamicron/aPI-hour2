package com.apihour.backend.repository;

import com.apihour.backend.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
  Optional<UserSession> findByUserIdAndStatusNot(String userId, UserSession.SessionStatus status);
  Optional<UserSession> findByUserId(String userId);
}
