package com.temi.stamprally.web.dto;

import jakarta.validation.constraints.NotBlank;

public record StampClaimRequest(@NotBlank String qrValue) {}
