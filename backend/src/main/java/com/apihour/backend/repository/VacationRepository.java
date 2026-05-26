package com.apihour.backend.repository;

import com.apihour.backend.model.Vacation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;

public interface VacationRepository extends JpaRepository<Vacation, String> {
  List<Vacation> findByUserId(String userId);
  
  List<Vacation> findByUserIdAndStartDateBetween(String userId, Date startDate, Date endDate);
  
  List<Vacation> findByUserIdOrderByStartDateDesc(String userId);
  
  List<Vacation> findByUserIdAndStatus(String userId, Vacation.VacationStatus status);
}
