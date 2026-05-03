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
    name = "collected_stamps",
    uniqueConstraints = @UniqueConstraint(columnNames = {"visitor_id", "stamp_spot_id"}))
public class CollectedStamp {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "visitor_id", nullable = false)
  private Visitor visitor;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "stamp_spot_id", nullable = false)
  private StampSpot stampSpot;

  @Column(nullable = false)
  private Instant collectedAt = Instant.now();

  protected CollectedStamp() {}

  public CollectedStamp(Visitor visitor, StampSpot stampSpot) {
    this.visitor = visitor;
    this.stampSpot = stampSpot;
  }

  public Long getId() {
    return id;
  }

  public Visitor getVisitor() {
    return visitor;
  }

  public StampSpot getStampSpot() {
    return stampSpot;
  }

  public Instant getCollectedAt() {
    return collectedAt;
  }
}
