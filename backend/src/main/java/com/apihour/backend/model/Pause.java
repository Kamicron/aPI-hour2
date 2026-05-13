package com.apihour.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.util.Date;
import java.util.UUID;

@Entity
@Table(name = "pauses")
public class Pause {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false)
  private Date pauseStart;

  @Column
  private Date pauseEnd;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Date createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Date updatedAt;

  @Column(length = 36)
  private String timeEntryId;

  @Column
  private Date deletedAt;

  public Pause() {
    this.id = UUID.randomUUID().toString();
  }

  public Pause(String timeEntryId, Date pauseStart) {
    this.id = UUID.randomUUID().toString();
    this.timeEntryId = timeEntryId;
    this.pauseStart = pauseStart;
  }

  // Getters and Setters
  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public Date getPauseStart() {
    return pauseStart;
  }

  public void setPauseStart(Date pauseStart) {
    this.pauseStart = pauseStart;
  }

  public Date getPauseEnd() {
    return pauseEnd;
  }

  public void setPauseEnd(Date pauseEnd) {
    this.pauseEnd = pauseEnd;
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

  public String getTimeEntryId() {
    return timeEntryId;
  }

  public void setTimeEntryId(String timeEntryId) {
    this.timeEntryId = timeEntryId;
  }

  public Date getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(Date deletedAt) {
    this.deletedAt = deletedAt;
  }
}
