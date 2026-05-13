package com.apihour.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "time_entries")
public class TimeEntry {
  @Id
  @Column(length = 36)
  private String id;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Date createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Date updatedAt;

  @Column
  private Date deletedAt;

  @Column(length = 36)
  private String userId;

  @Column(nullable = false)
  private Date startTime;

  @Column
  private Date endTime;

  public TimeEntry() {
    this.id = UUID.randomUUID().toString();
  }

  public TimeEntry(String userId, Date startTime) {
    this.id = UUID.randomUUID().toString();
    this.userId = userId;
    this.startTime = startTime;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
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

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public Date getStartTime() {
    return startTime;
  }

  public void setStartTime(Date startTime) {
    this.startTime = startTime;
  }

  public Date getEndTime() {
    return endTime;
  }

  public void setEndTime(Date endTime) {
    this.endTime = endTime;
  }
}
