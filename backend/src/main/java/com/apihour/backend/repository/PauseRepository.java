package com.apihour.backend.repository;

import com.apihour.backend.model.Pause;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PauseRepository extends JpaRepository<Pause, String> {
  List<Pause> findByTimeEntryId(String timeEntryId);
}
