package com.apihour.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "vacations")
public class Vacation {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "start_date", nullable = false)
  private Date startDate;

  @Column(name = "end_date", nullable = false)
  private Date endDate;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private VacationStatus status = VacationStatus.pending;

  @Column(columnDefinition = "TEXT")
  private String reason;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Date createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Date updatedAt;

  @Column(name = "user_id", length = 36, nullable = false)
  private String userId;

  public enum VacationStatus {
    pending, approved, rejected, public_holiday, sick_leave
  }

  public Vacation() {
    this.id = UUID.randomUUID().toString();
  }

  public Vacation(String userId, Date startDate, Date endDate, VacationStatus status, String reason) {
    this.id = UUID.randomUUID().toString();
    this.userId = userId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.status = status;
    this.reason = reason;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public Date getStartDate() {
    return startDate;
  }

  public void setStartDate(Date startDate) {
    this.startDate = startDate;
  }

  public Date getEndDate() {
    return endDate;
  }

  public void setEndDate(Date endDate) {
    this.endDate = endDate;
  }

  public VacationStatus getStatus() {
    return status;
  }

  public void setStatus(VacationStatus status) {
    this.status = status;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
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

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }
}
