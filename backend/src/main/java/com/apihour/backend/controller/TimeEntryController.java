package com.apihour.backend.controller;

import com.apihour.backend.model.Pause;
import com.apihour.backend.model.TimeEntry;
import com.apihour.backend.model.Users;
import com.apihour.backend.repository.PauseRepository;
import com.apihour.backend.repository.TimeEntryRepository;
import com.apihour.backend.repository.UserSessionRepository;
import com.apihour.backend.repository.UsersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/time-entries")
public class TimeEntryController {

  private final TimeEntryRepository timeEntryRepository;
  private final PauseRepository pauseRepository;
  private final UserSessionRepository userSessionRepository;
  private final UsersRepository usersRepository;

  public TimeEntryController(TimeEntryRepository timeEntryRepository,
      PauseRepository pauseRepository,
      UserSessionRepository userSessionRepository,
      UsersRepository usersRepository) {
    this.timeEntryRepository = timeEntryRepository;
    this.pauseRepository = pauseRepository;
    this.userSessionRepository = userSessionRepository;
    this.usersRepository = usersRepository;
  }

  private String getUserIdFromAuth() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = auth.getName();
    Users user = usersRepository.findByEmail(userEmail);
    return user.getId().toString();
  }

  @PostMapping
  public ResponseEntity<?> createTimeEntry(@RequestBody Map<String, Object> request) {
    try {
      String userId = getUserIdFromAuth();

      String startTimeStr = (String) request.get("startTime");
      String endTimeStr = (String) request.get("endTime");

      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
      Date startTime = sdf.parse(startTimeStr);
      Date endTime = endTimeStr != null ? sdf.parse(endTimeStr) : null;

      TimeEntry timeEntry = new TimeEntry(userId, startTime);
      timeEntry.setEndTime(endTime);
      timeEntry = timeEntryRepository.save(timeEntry);

      List<Map<String, String>> pausesData = (List<Map<String, String>>) request.get("pauses");
      List<Pause> pauses = new ArrayList<>();

      if (pausesData != null) {
        for (Map<String, String> pauseData : pausesData) {
          Date pauseStart = sdf.parse(pauseData.get("pauseStart"));
          Date pauseEnd = pauseData.get("pauseEnd") != null ? sdf.parse(pauseData.get("pauseEnd")) : null;

          Pause pause = new Pause(timeEntry.getId(), pauseStart);
          pause.setPauseEnd(pauseEnd);
          pauses.add(pauseRepository.save(pause));
        }
      }

      Map<String, Object> response = new HashMap<>();
      response.put("timeEntry", timeEntry);
      response.put("pauses", pauses);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> updateTimeEntry(@PathVariable String id, @RequestBody Map<String, Object> request) {
    try {
      String userId = getUserIdFromAuth();

      TimeEntry timeEntry = timeEntryRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("TimeEntry not found"));

      if (!timeEntry.getUserId().equals(userId)) {
        return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
      }

      String startTimeStr = (String) request.get("startTime");
      String endTimeStr = (String) request.get("endTime");

      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm");
      Date startTime = sdf.parse(startTimeStr);
      Date endTime = endTimeStr != null ? sdf.parse(endTimeStr) : null;

      timeEntry.setStartTime(startTime);
      timeEntry.setEndTime(endTime);
      timeEntry = timeEntryRepository.save(timeEntry);

      List<Pause> existingPauses = pauseRepository.findByTimeEntryId(id);
      for (Pause pause : existingPauses) {
        pauseRepository.delete(pause);
      }

      List<Map<String, String>> pausesData = (List<Map<String, String>>) request.get("pauses");
      List<Pause> pauses = new ArrayList<>();

      if (pausesData != null) {
        for (Map<String, String> pauseData : pausesData) {
          Date pauseStart = sdf.parse(pauseData.get("pauseStart"));
          Date pauseEnd = pauseData.get("pauseEnd") != null ? sdf.parse(pauseData.get("pauseEnd")) : null;

          Pause pause = new Pause(timeEntry.getId(), pauseStart);
          pause.setPauseEnd(pauseEnd);
          pauses.add(pauseRepository.save(pause));
        }
      }

      Map<String, Object> response = new HashMap<>();
      response.put("timeEntry", timeEntry);
      response.put("pauses", pauses);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteTimeEntry(@PathVariable String id) {
    try {
      String userId = getUserIdFromAuth();

      TimeEntry timeEntry = timeEntryRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("TimeEntry not found"));

      if (!timeEntry.getUserId().equals(userId)) {
        return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
      }

      // Delete user_sessions that reference this time_entry (foreign key constraint)
      // Use native SQL query to avoid loading the entity (which causes enum parsing
      // issues)
      userSessionRepository.deleteByTimeEntryIdNative(id);

      // Delete pauses
      List<Pause> pauses = pauseRepository.findByTimeEntryId(id);
      for (Pause pause : pauses) {
        pauseRepository.delete(pause);
      }

      // Delete time_entry
      timeEntryRepository.delete(timeEntry);

      return ResponseEntity.ok(Map.of("message", "TimeEntry deleted successfully"));
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getTimeEntry(@PathVariable String id) {
    try {
      String userId = getUserIdFromAuth();

      TimeEntry timeEntry = timeEntryRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("TimeEntry not found"));

      if (!timeEntry.getUserId().equals(userId)) {
        return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
      }

      List<Pause> pauses = pauseRepository.findByTimeEntryId(id);

      Map<String, Object> response = new HashMap<>();
      response.put("timeEntry", timeEntry);
      response.put("pauses", pauses);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }
}
