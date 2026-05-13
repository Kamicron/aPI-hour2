package com.apihour.backend.controller;

import com.apihour.backend.config.JwtUtils;
import com.apihour.backend.model.Pause;
import com.apihour.backend.model.TimeEntry;
import com.apihour.backend.model.UserSession;
import com.apihour.backend.model.Users;
import com.apihour.backend.repository.PauseRepository;
import com.apihour.backend.repository.TimeEntryRepository;
import com.apihour.backend.repository.UserSessionRepository;
import com.apihour.backend.repository.UsersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/session")
public class SessionController {

  private final UserSessionRepository userSessionRepository;
  private final TimeEntryRepository timeEntryRepository;
  private final PauseRepository pauseRepository;
  private final UsersRepository usersRepository;
  private final JwtUtils jwtUtils;

  public SessionController(UserSessionRepository userSessionRepository,
      TimeEntryRepository timeEntryRepository,
      PauseRepository pauseRepository,
      UsersRepository usersRepository,
      JwtUtils jwtUtils) {
    this.userSessionRepository = userSessionRepository;
    this.timeEntryRepository = timeEntryRepository;
    this.pauseRepository = pauseRepository;
    this.usersRepository = usersRepository;
    this.jwtUtils = jwtUtils;
  }

  private String getUserIdFromAuth() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = auth.getName();
    Users user = usersRepository.findByEmail(userEmail);
    return user.getId().toString();
  }

  @GetMapping("/current")
  public ResponseEntity<?> getCurrentSession() {
    try {
      String userId = getUserIdFromAuth();

      UserSession session = userSessionRepository.findByUserIdAndStatusNot(userId, UserSession.SessionStatus.NULL)
          .orElse(null);

      if (session == null) {
        return ResponseEntity.ok(Map.of("session", (Object) null));
      }

      TimeEntry timeEntry = timeEntryRepository.findById(session.getTimeEntryId()).orElse(null);
      List<Pause> pauses = pauseRepository.findByTimeEntryId(session.getTimeEntryId());
      Pause currentPause = session.getPauseId() != null ? pauseRepository.findById(session.getPauseId()).orElse(null)
          : null;

      Map<String, Object> response = new HashMap<>();
      response.put("session", session);
      response.put("timeEntry", timeEntry);
      response.put("pauses", pauses);
      response.put("currentPause", currentPause);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/start")
  public ResponseEntity<?> startSession() {
    try {
      String userId = getUserIdFromAuth();

      UserSession existingSession = userSessionRepository
          .findByUserIdAndStatusNot(userId, UserSession.SessionStatus.NULL)
          .orElse(null);

      if (existingSession != null) {
        return ResponseEntity.badRequest().body(Map.of("error", "Une session est déjà en cours"));
      }

      TimeEntry timeEntry = new TimeEntry(userId, new Date());
      timeEntry = timeEntryRepository.save(timeEntry);

      UserSession session = new UserSession(userId, timeEntry.getId(), UserSession.SessionStatus.started);
      session = userSessionRepository.save(session);

      Map<String, Object> response = new HashMap<>();
      response.put("session", session);
      response.put("timeEntry", timeEntry);
      response.put("pauses", List.of());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/pause")
  public ResponseEntity<?> pauseSession() {
    try {
      String userId = getUserIdFromAuth();

      UserSession session = userSessionRepository.findByUserIdAndStatusNot(userId, UserSession.SessionStatus.NULL)
          .orElseThrow(() -> new RuntimeException("Aucune session active"));

      if (session.getStatus() == UserSession.SessionStatus.paused) {
        return ResponseEntity.badRequest().body(Map.of("error", "La session est déjà en pause"));
      }

      Pause pause = new Pause(session.getTimeEntryId(), new Date());
      pause = pauseRepository.save(pause);

      session.setStatus(UserSession.SessionStatus.paused);
      session.setPauseId(pause.getId());
      session = userSessionRepository.save(session);

      TimeEntry timeEntry = timeEntryRepository.findById(session.getTimeEntryId()).orElse(null);
      List<Pause> pauses = pauseRepository.findByTimeEntryId(session.getTimeEntryId());

      Map<String, Object> response = new HashMap<>();
      response.put("session", session);
      response.put("timeEntry", timeEntry);
      response.put("pauses", pauses);
      response.put("currentPause", pause);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/resume")
  public ResponseEntity<?> resumeSession() {
    try {
      String userId = getUserIdFromAuth();

      UserSession session = userSessionRepository.findByUserIdAndStatusNot(userId, UserSession.SessionStatus.NULL)
          .orElseThrow(() -> new RuntimeException("Aucune session active"));

      if (session.getStatus() != UserSession.SessionStatus.paused) {
        return ResponseEntity.badRequest().body(Map.of("error", "La session n'est pas en pause"));
      }

      if (session.getPauseId() != null) {
        Pause pause = pauseRepository.findById(session.getPauseId()).orElse(null);
        if (pause != null) {
          pause.setPauseEnd(new Date());
          pauseRepository.save(pause);
        }
      }

      session.setStatus(UserSession.SessionStatus.started);
      session.setPauseId(null);
      session = userSessionRepository.save(session);

      TimeEntry timeEntry = timeEntryRepository.findById(session.getTimeEntryId()).orElse(null);
      List<Pause> pauses = pauseRepository.findByTimeEntryId(session.getTimeEntryId());

      Map<String, Object> response = new HashMap<>();
      response.put("session", session);
      response.put("timeEntry", timeEntry);
      response.put("pauses", pauses);
      response.put("currentPause", (Object) null);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @PostMapping("/stop")
  public ResponseEntity<?> stopSession() {
    try {
      String userId = getUserIdFromAuth();

      UserSession session = userSessionRepository.findByUserIdAndStatusNot(userId, UserSession.SessionStatus.NULL)
          .orElseThrow(() -> new RuntimeException("Aucune session active"));

      // End active pause if exists
      if (session.getPauseId() != null) {
        Pause pause = pauseRepository.findById(session.getPauseId()).orElse(null);
        if (pause != null && pause.getPauseEnd() == null) {
          pause.setPauseEnd(new Date());
          pauseRepository.save(pause);
        }
      }

      // End time entry
      TimeEntry timeEntry = timeEntryRepository.findById(session.getTimeEntryId()).orElse(null);
      if (timeEntry != null) {
        timeEntry.setEndTime(new Date());
        timeEntryRepository.save(timeEntry);
      }

      // Clear session
      session.setStatus(UserSession.SessionStatus.NULL);
      session.setPauseId(null);
      userSessionRepository.save(session);

      return ResponseEntity.ok(Map.of("message", "Session terminée"));
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }
}
