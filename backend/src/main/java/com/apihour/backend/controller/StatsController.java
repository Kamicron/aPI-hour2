package com.apihour.backend.controller;

import com.apihour.backend.model.TimeEntry;
import com.apihour.backend.model.Users;
import com.apihour.backend.model.Pause;
import com.apihour.backend.repository.TimeEntryRepository;
import com.apihour.backend.repository.UsersRepository;
import com.apihour.backend.repository.PauseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.time.*;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

  private final TimeEntryRepository timeEntryRepository;
  private final UsersRepository usersRepository;
  private final PauseRepository pauseRepository;

  public StatsController(TimeEntryRepository timeEntryRepository,
      UsersRepository usersRepository,
      PauseRepository pauseRepository) {
    this.timeEntryRepository = timeEntryRepository;
    this.usersRepository = usersRepository;
    this.pauseRepository = pauseRepository;
  }

  private String getUserIdFromAuth() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = auth.getName();
    Users user = usersRepository.findByEmail(userEmail);
    return user.getId().toString();
  }

  private double calculateHoursForPeriod(String userId, Date startDate, Date endDate) {
    List<TimeEntry> entries = timeEntryRepository.findByUserIdAndStartTimeBetween(userId, startDate, endDate);
    double totalHours = 0.0;

    for (TimeEntry entry : entries) {
      if (entry.getEndTime() != null) {
        long workMillis = entry.getEndTime().getTime() - entry.getStartTime().getTime();

        // Subtract pause time
        List<Pause> pauses = pauseRepository.findByTimeEntryId(entry.getId());
        long pauseMillis = 0;
        for (Pause pause : pauses) {
          if (pause.getPauseEnd() != null) {
            pauseMillis += pause.getPauseEnd().getTime() - pause.getPauseStart().getTime();
          }
        }

        long netWorkMillis = workMillis - pauseMillis;
        totalHours += netWorkMillis / (1000.0 * 60 * 60);
      }
    }

    return totalHours;
  }

  @GetMapping("/weekly-hours")
  public ResponseEntity<?> getWeeklyHours() {
    try {
      String userId = getUserIdFromAuth();
      Users user = usersRepository.findById(UUID.fromString(userId)).orElse(null);

      if (user == null) {
        return ResponseEntity.notFound().build();
      }

      // Get start and end of current week (Monday to Sunday)
      LocalDate today = LocalDate.now();
      LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
      LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

      Date weekStart = Date.from(monday.atStartOfDay(ZoneId.systemDefault()).toInstant());
      Date weekEnd = Date.from(sunday.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant());

      double totalHours = calculateHoursForPeriod(userId, weekStart, weekEnd);

      Map<String, Object> response = new HashMap<>();
      response.put("weeklyGoal", user.getWeeklyHoursGoal() != null ? user.getWeeklyHoursGoal() : 40);
      response.put("hoursWorked", Math.round(totalHours * 100.0) / 100.0);
      response.put("weekStart", weekStart);
      response.put("weekEnd", weekEnd);
      response.put("percentage", user.getWeeklyHoursGoal() != null && user.getWeeklyHoursGoal() > 0
          ? Math.round((totalHours / user.getWeeklyHoursGoal()) * 100.0 * 100.0) / 100.0
          : 0.0);

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/overtime")
  public ResponseEntity<?> getOvertimeHours() {
    try {
      String userId = getUserIdFromAuth();
      Users user = usersRepository.findById(UUID.fromString(userId)).orElse(null);

      if (user == null) {
        return ResponseEntity.notFound().build();
      }

      int weeklyGoal = user.getWeeklyHoursGoal() != null ? user.getWeeklyHoursGoal() : 40;

      LocalDate today = LocalDate.now();

      // Calculate month boundaries aligned to Monday-Sunday weeks
      LocalDate firstOfMonth = today.withDayOfMonth(1);
      LocalDate lastOfMonth = today.withDayOfMonth(today.lengthOfMonth());

      // If 1st is not Monday, go back to previous Monday
      LocalDate monthStart = firstOfMonth.getDayOfWeek() == DayOfWeek.MONDAY
          ? firstOfMonth
          : firstOfMonth.with(TemporalAdjusters.previous(DayOfWeek.MONDAY));

      // If last day is not Sunday, go forward to next Sunday
      LocalDate monthEnd = lastOfMonth.getDayOfWeek() == DayOfWeek.SUNDAY
          ? lastOfMonth
          : lastOfMonth.with(TemporalAdjusters.next(DayOfWeek.SUNDAY));

      // Calculate overtime week by week, only counting positive overtime
      double monthlyOvertime = 0.0;
      LocalDate weekStart = monthStart;

      while (!weekStart.isAfter(monthEnd)) {
        LocalDate weekEnd = weekStart.plusDays(6); // Sunday
        if (weekEnd.isAfter(monthEnd)) {
          weekEnd = monthEnd;
        }

        Date weekStartDate = Date.from(weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date weekEndDate = Date.from(weekEnd.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant());

        double weekHours = calculateHoursForPeriod(userId, weekStartDate, weekEndDate);
        double weekOvertime = weekHours - weeklyGoal;

        // Only add positive overtime (hours worked above goal)
        if (weekOvertime > 0) {
          monthlyOvertime += weekOvertime;
        }

        weekStart = weekStart.plusWeeks(1);
      }

      // Calculate current week overtime
      LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
      LocalDate currentSunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

      Date currentWeekStart = Date.from(currentMonday.atStartOfDay(ZoneId.systemDefault()).toInstant());
      Date currentWeekEnd = Date.from(currentSunday.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant());

      double currentWeekHours = calculateHoursForPeriod(userId, currentWeekStart, currentWeekEnd);
      double currentWeekOvertime = currentWeekHours - weeklyGoal;

      // Only return positive overtime for current week
      if (currentWeekOvertime < 0) {
        currentWeekOvertime = 0;
      }

      Map<String, Object> response = new HashMap<>();
      response.put("monthlyOvertime", Math.round(monthlyOvertime * 100.0) / 100.0);
      response.put("weeklyOvertime", Math.round(currentWeekOvertime * 100.0) / 100.0);
      response.put("monthStart", Date.from(monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant()));
      response.put("monthEnd", Date.from(monthEnd.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant()));

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }

  @GetMapping("/week-history")
  public ResponseEntity<?> getWeekHistory() {
    try {
      String userId = getUserIdFromAuth();
      Users user = usersRepository.findById(UUID.fromString(userId)).orElse(null);

      if (user == null) {
        return ResponseEntity.notFound().build();
      }

      int dailyGoal = user.getWeeklyHoursGoal() != null ? user.getWeeklyHoursGoal() / 5 : 8;

      LocalDate today = LocalDate.now();
      LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

      System.out.println("=== Week History Debug ===");
      System.out.println("Today: " + today);
      System.out.println("Monday of week: " + monday);
      System.out.println("User ID: " + userId);

      List<Map<String, Object>> weekData = new ArrayList<>();
      String[] dayNames = { "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi" };
      String[] monthNames = { "jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc" };

      for (int i = 0; i < 5; i++) {
        LocalDate currentDay = monday.plusDays(i);
        Date dayStart = Date.from(currentDay.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date dayEnd = Date.from(currentDay.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant());

        System.out.println("\nDay " + i + " (" + dayNames[i] + " " + currentDay + "):");
        System.out.println("  Range: " + dayStart + " to " + dayEnd);

        List<TimeEntry> entries = timeEntryRepository.findByUserIdAndStartTimeBetween(userId, dayStart, dayEnd);
        System.out.println("  Found " + entries.size() + " entries");

        Map<String, Object> dayData = new HashMap<>();
        dayData.put("dayName", dayNames[i]);
        dayData.put("date", currentDay.getDayOfMonth() + " " + monthNames[currentDay.getMonthValue() - 1]);
        dayData.put("fullDate", currentDay.toString());

        if (!entries.isEmpty()) {
          // Get first entry for initial start time
          TimeEntry firstEntry = entries.get(0);

          // Find earliest start time
          LocalTime startTime = firstEntry.getStartTime().toInstant()
              .atZone(ZoneId.systemDefault()).toLocalTime();
          for (TimeEntry e : entries) {
            LocalTime entryStart = e.getStartTime().toInstant()
                .atZone(ZoneId.systemDefault()).toLocalTime();
            if (entryStart.isBefore(startTime)) {
              startTime = entryStart;
            }
          }
          dayData.put("startTime", String.format("%02d:%02d", startTime.getHour(), startTime.getMinute()));

          // Calculate totals across all entries
          long totalWorkMillis = 0;
          long totalPauseMillis = 0;
          boolean hasOngoingSession = false;
          LocalTime latestEndTime = null;

          for (TimeEntry entry : entries) {
            // Calculate work time for this entry
            long workMillis;
            if (entry.getEndTime() != null) {
              workMillis = entry.getEndTime().getTime() - entry.getStartTime().getTime();
              LocalTime endTime = entry.getEndTime().toInstant()
                  .atZone(ZoneId.systemDefault()).toLocalTime();
              if (latestEndTime == null || endTime.isAfter(latestEndTime)) {
                latestEndTime = endTime;
              }
            } else {
              // Ongoing session
              workMillis = System.currentTimeMillis() - entry.getStartTime().getTime();
              hasOngoingSession = true;
            }

            // Calculate pause time for this entry
            List<Pause> pauses = pauseRepository.findByTimeEntryId(entry.getId());
            long entryPauseMillis = 0;
            for (Pause pause : pauses) {
              if (pause.getPauseEnd() != null) {
                entryPauseMillis += pause.getPauseEnd().getTime() - pause.getPauseStart().getTime();
              } else {
                // Ongoing pause
                entryPauseMillis += System.currentTimeMillis() - pause.getPauseStart().getTime();
              }
            }

            totalWorkMillis += workMillis;
            totalPauseMillis += entryPauseMillis;
          }

          // Set end time
          if (latestEndTime != null) {
            dayData.put("endTime", String.format("%02d:%02d", latestEndTime.getHour(), latestEndTime.getMinute()));
          } else {
            dayData.put("endTime", null);
          }

          // Format pause duration
          int pauseMinutes = (int) (totalPauseMillis / (1000 * 60));
          dayData.put("pauseDuration", String.format("%02d:%02d", pauseMinutes / 60, pauseMinutes % 60));

          // Calculate net work time
          long netWorkMillis = totalWorkMillis - totalPauseMillis;
          int totalMinutes = (int) (netWorkMillis / (1000 * 60));
          int hours = totalMinutes / 60;
          int minutes = totalMinutes % 60;
          dayData.put("totalDuration", String.format("%02d:%02d", hours, minutes));

          // Calculate overtime
          double totalHours = netWorkMillis / (1000.0 * 60 * 60);
          double overtime = totalHours - dailyGoal;
          if (overtime > 0) {
            int overtimeMinutes = (int) (overtime * 60);
            dayData.put("overtime", String.format("%02d:%02d", overtimeMinutes / 60, overtimeMinutes % 60));
          } else {
            dayData.put("overtime", "00:00");
          }

          // Set status
          if (hasOngoingSession) {
            dayData.put("status", "En cours");
          } else {
            dayData.put("status", "Validée");
          }
        } else {
          dayData.put("startTime", null);
          dayData.put("endTime", null);
          dayData.put("pauseDuration", null);
          dayData.put("totalDuration", null);
          dayData.put("overtime", null);
          dayData.put("status", "—");
        }

        weekData.add(dayData);
      }

      return ResponseEntity.ok(weekData);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
  }
}
