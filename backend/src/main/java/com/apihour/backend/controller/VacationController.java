package com.apihour.backend.controller;

import com.apihour.backend.model.Vacation;
import com.apihour.backend.service.VacationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/vacations")
public class VacationController {

  @Autowired
  private VacationService vacationService;

  @GetMapping
  public ResponseEntity<List<Vacation>> getAllVacations() {
    List<Vacation> vacations = vacationService.getAllVacations();
    return ResponseEntity.ok(vacations);
  }

  @GetMapping("/user/{userId}")
  public ResponseEntity<List<Vacation>> getVacationsByUserId(@PathVariable String userId) {
    List<Vacation> vacations = vacationService.getVacationsByUserId(userId);
    return ResponseEntity.ok(vacations);
  }

  @GetMapping("/user/{userId}/status/{status}")
  public ResponseEntity<List<Vacation>> getVacationsByUserIdAndStatus(
      @PathVariable String userId,
      @PathVariable Vacation.VacationStatus status) {
    List<Vacation> vacations = vacationService.getVacationsByUserIdAndStatus(userId, status);
    return ResponseEntity.ok(vacations);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Vacation> getVacationById(@PathVariable String id) {
    Optional<Vacation> vacation = vacationService.getVacationById(id);
    return vacation.map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<Vacation> createVacation(@RequestBody Vacation vacation) {
    Vacation createdVacation = vacationService.createVacation(vacation);
    return ResponseEntity.status(HttpStatus.CREATED).body(createdVacation);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Vacation> updateVacation(
      @PathVariable String id,
      @RequestBody Vacation vacationDetails) {
    Vacation updatedVacation = vacationService.updateVacation(id, vacationDetails);

    if (updatedVacation != null) {
      return ResponseEntity.ok(updatedVacation);
    }

    return ResponseEntity.notFound().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteVacation(@PathVariable String id) {
    boolean deleted = vacationService.deleteVacation(id);

    if (deleted) {
      return ResponseEntity.noContent().build();
    }

    return ResponseEntity.notFound().build();
  }
}
