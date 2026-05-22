package com.temi.stamprally.web.dto;

import jakarta.validation.constraints.Size;

public record EventRecommendRequest(
    @Size(max = 500) String interests, @Size(max = 120) String companion) {}
