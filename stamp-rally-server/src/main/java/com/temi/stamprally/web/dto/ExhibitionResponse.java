package com.temi.stamprally.web.dto;

import com.temi.stamprally.domain.Exhibition;

public record ExhibitionResponse(
    long id,
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

  public static ExhibitionResponse from(Exhibition e) {
    return new ExhibitionResponse(
        e.getId(),
        e.getName(),
        e.getDescription(),
        e.getZone(),
        e.getLocationText(),
        e.getImageUrl() != null ? e.getImageUrl() : "",
        e.getLatitude(),
        e.getLongitude(),
        e.getEstimatedMinutes(),
        e.getDirectionHint(),
        e.getRelatedEvent() != null ? e.getRelatedEvent() : "");
  }
}
