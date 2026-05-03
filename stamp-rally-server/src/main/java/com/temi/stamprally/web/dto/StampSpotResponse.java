package com.temi.stamprally.web.dto;

public record StampSpotResponse(
    String code, String name, double latitude, double longitude, Double distanceMeters) {}
