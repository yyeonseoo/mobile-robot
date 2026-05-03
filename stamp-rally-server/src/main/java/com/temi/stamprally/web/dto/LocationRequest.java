package com.temi.stamprally.web.dto;

import jakarta.validation.constraints.NotNull;

public record LocationRequest(
    @NotNull Double latitude, @NotNull Double longitude) {}
