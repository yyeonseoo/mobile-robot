package com.temi.stamprally.web.dto;

public record VisitorEventActionResponse(
    long id, String eventId, String actionType, String createdAt) {}

