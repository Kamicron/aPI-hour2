package com.apihour.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.util.Date;
import java.util.UUID;

@Entity
public class Users {
  @Id
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;
  private String name;
  private String email;
  private String password;
  private String role;
  private Date createdAt;
  private Date updatedAt;
  private Date deletedAt;
  private Integer weeklyHoursGoal;
  private Integer workingDays;

  // Constructors
  public Users() {
  }

  public Users(String name, String email, String password, String role, Integer weeklyHoursGoal, Integer workingDays) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.weeklyHoursGoal = weeklyHoursGoal;
    this.workingDays = workingDays;
  }


  // Getters - Setters
  public UUID getId() {
    return id;
  }
  
  public String getName() {
    return name;
  }
  
  public void setName(String name) {
    this.name = name;
  }
  
  public String getEmail() {
    return email;
  }
  
  public void setEmail(String email) {
    this.email = email;
  }
  
  public String getPassword() {
    return password;
  }
  
  public void setPassword(String password) {
    this.password = password;
  }
  
  public String getRole() {
    return role;
  }
  
  public void setRole(String role) {
    this.role = role;
  }
  
  public Date getCreatedAt() {
    return createdAt;
  }
  
  public void setCreatedAt(Date createdAt) {
    this.createdAt = createdAt;
  }
  
  public Date getUpdatedAt() {
    return updatedAt;
  }
  
  public void setUpdatedAt(Date updatedAt) {
    this.updatedAt = updatedAt;
  }
  
  public Date getDeletedAt() {
    return deletedAt;
  }
  
  public void setDeletedAt(Date deletedAt) {
    this.deletedAt = deletedAt;
  }
  
  public Integer getWeeklyHoursGoal() {
    return weeklyHoursGoal;
  }
  
  public void setWeeklyHoursGoal(Integer weeklyHoursGoal) {
    this.weeklyHoursGoal = weeklyHoursGoal;
  }
  
  public Integer getWorkingDays() {
    return workingDays;
  }
  
  public void setWorkingDays(Integer workingDays) {
    this.workingDays = workingDays;
  }
}
