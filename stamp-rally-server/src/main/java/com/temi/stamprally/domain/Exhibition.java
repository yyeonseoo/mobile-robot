package com.temi.stamprally.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "exhibitions")
public class Exhibition {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 4000)
  private String description;

  @Column(nullable = false, length = 64)
  private String zone;

  @Column(nullable = false, length = 512)
  private String locationText;

  @Column(length = 1024)
  private String imageUrl;

  @Column(nullable = false)
  private double latitude;

  @Column(nullable = false)
  private double longitude;

  @Column(nullable = false)
  private int estimatedMinutes;

  @Column(nullable = false, length = 512)
  private String directionHint;

  @Column(length = 512)
  private String relatedEvent;

  protected Exhibition() {}

  public Exhibition(
      String name,
      String description,
      String zone,
      String locationText,
      String imageUrl,
      double latitude,
      double longitude,
      int estimatedMinutes,
      String directionHint,
      String relatedEvent) {
    this.name = name;
    this.description = description;
    this.zone = zone;
    this.locationText = locationText;
    this.imageUrl = imageUrl;
    this.latitude = latitude;
    this.longitude = longitude;
    this.estimatedMinutes = estimatedMinutes;
    this.directionHint = directionHint;
    this.relatedEvent = relatedEvent;
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public String getZone() {
    return zone;
  }

  public String getLocationText() {
    return locationText;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public double getLatitude() {
    return latitude;
  }

  public double getLongitude() {
    return longitude;
  }

  public int getEstimatedMinutes() {
    return estimatedMinutes;
  }

  public String getDirectionHint() {
    return directionHint;
  }

  public String getRelatedEvent() {
    return relatedEvent;
  }
}
