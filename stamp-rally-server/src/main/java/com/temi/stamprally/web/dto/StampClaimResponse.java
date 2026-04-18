package com.temi.stamprally.web.dto;

public record StampClaimResponse(
    boolean newlyCollected,
    boolean alreadyHad,
    String spotCode,
    String spotName,
    int totalCollected,
    int totalSpots,
    boolean rallyComplete) {}
