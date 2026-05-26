package com.apihour.backend.service;

import com.apihour.backend.model.Vacation;
import com.apihour.backend.repository.VacationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class VacationService {

  @Autowired
  private VacationRepository vacationRepository;

  public List<Vacation> getAllVacations() {
    return vacationRepository.findAll();
  }

  public List<Vacation> getVacationsByUserId(String userId) {
    return vacationRepository.findByUserIdOrderByStartDateDesc(userId);
  }

  public List<Vacation> getVacationsByUserIdAndStatus(String userId, Vacation.VacationStatus status) {
    return vacationRepository.findByUserIdAndStatus(userId, status);
  }

  public List<Vacation> getVacationsByUserIdAndDateRange(String userId, Date startDate, Date endDate) {
    return vacationRepository.findByUserIdAndStartDateBetween(userId, startDate, endDate);
  }

  public Optional<Vacation> getVacationById(String id) {
    return vacationRepository.findById(id);
  }

  public Vacation createVacation(Vacation vacation) {
    return vacationRepository.save(vacation);
  }

  public Vacation updateVacation(String id, Vacation vacationDetails) {
    Optional<Vacation> vacation = vacationRepository.findById(id);
    
    if (vacation.isPresent()) {
      Vacation existingVacation = vacation.get();
      existingVacation.setStartDate(vacationDetails.getStartDate());
      existingVacation.setEndDate(vacationDetails.getEndDate());
      existingVacation.setStatus(vacationDetails.getStatus());
      existingVacation.setReason(vacationDetails.getReason());
      
      return vacationRepository.save(existingVacation);
    }
    
    return null;
  }

  public boolean deleteVacation(String id) {
    Optional<Vacation> vacation = vacationRepository.findById(id);
    
    if (vacation.isPresent()) {
      vacationRepository.delete(vacation.get());
      return true;
    }
    
    return false;
  }
}
