package com.temi.stamprally.web.dto;

public record RallyStatusResponse(
    int totalSpots, int collectedCount, boolean completed) {}
