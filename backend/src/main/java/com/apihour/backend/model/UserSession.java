package com.apihour.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "user_sessions")
public class UserSession {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private SessionStatus status = SessionStatus.NULL;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Date createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Date updatedAt;

  @Column(length = 36)
  private String userId;

  @Column(length = 36)
  private String timeEntryId;

  @Column(length = 36)
  private String pauseId;

  public enum SessionStatus {
    started, paused, NULL
  }

  public UserSession() {
    this.id = UUID.randomUUID().toString();
  }

  public UserSession(String userId, String timeEntryId, SessionStatus status) {
    this.id = UUID.randomUUID().toString();
    this.userId = userId;
    this.timeEntryId = timeEntryId;
    this.status = status;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public SessionStatus getStatus() {
    return status;
  }

  public void setStatus(SessionStatus status) {
    this.status = status;
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

  public String getTimeEntryId() {
    return timeEntryId;
  }

  public void setTimeEntryId(String timeEntryId) {
    this.timeEntryId = timeEntryId;
  }

  public String getPauseId() {
    return pauseId;
  }

  public void setPauseId(String pauseId) {
    this.pauseId = pauseId;
  }
}
