package com.temi.stamprally.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
    name = "visitor_event_actions",
    uniqueConstraints =
        @UniqueConstraint(columnNames = {"visitor_id", "event_id", "action_type"}))
public class VisitorEventAction {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "visitor_id", nullable = false)
  private Visitor visitor;

  @Column(name = "event_id", nullable = false, length = 64)
  private String eventId;

  @Column(name = "action_type", nullable = false, length = 16)
  private String actionType;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected VisitorEventAction() {}

  public static VisitorEventAction create(Visitor visitor, String eventId, String actionType) {
    VisitorEventAction a = new VisitorEventAction();
    a.visitor = visitor;
    a.eventId = eventId;
    a.actionType = actionType;
    return a;
  }

  public Long getId() {
    return id;
  }

  public Visitor getVisitor() {
    return visitor;
  }

  public String getEventId() {
    return eventId;
  }

  public String getActionType() {
    return actionType;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}

