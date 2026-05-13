package com.apihour.backend.repository;

import com.apihour.backend.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, String> {
  List<TimeEntry> findByUserId(String userId);

  List<TimeEntry> findByUserIdAndStartTimeBetween(String userId, Date startDate, Date endDate);
}
