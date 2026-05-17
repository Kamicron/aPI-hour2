package com.apihour.backend.repository;

import com.apihour.backend.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {
  Optional<UserSession> findByUserIdAndStatusNot(String userId, UserSession.SessionStatus status);

  Optional<UserSession> findByUserId(String userId);

  Optional<UserSession> findByTimeEntryId(String timeEntryId);

  @Modifying
  @Transactional
  @Query(value = "DELETE FROM user_sessions WHERE time_entry_id = :timeEntryId", nativeQuery = true)
  void deleteByTimeEntryIdNative(@Param("timeEntryId") String timeEntryId);
}
