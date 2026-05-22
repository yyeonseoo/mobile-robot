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
import java.time.Instant;

@Entity
@Table(name = "visitor_photos")
public class VisitorPhoto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "visitor_id", nullable = false)
  private Visitor visitor;

  @Column(nullable = false, length = 32)
  private String kind = "strip";

  @Column(nullable = false, length = 255)
  private String storagePath;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected VisitorPhoto() {}

  public static VisitorPhoto create(Visitor visitor, String kind, String storagePath) {
    VisitorPhoto p = new VisitorPhoto();
    p.visitor = visitor;
    p.kind = kind != null && !kind.isBlank() ? kind.trim() : "strip";
    p.storagePath = storagePath;
    return p;
  }

  public Long getId() {
    return id;
  }

  public Visitor getVisitor() {
    return visitor;
  }

  public String getKind() {
    return kind;
  }

  public String getStoragePath() {
    return storagePath;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
