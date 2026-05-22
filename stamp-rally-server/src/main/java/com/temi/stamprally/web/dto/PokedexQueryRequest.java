package com.temi.stamprally.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PokedexQueryRequest(
    @NotBlank @Size(max = 120) String query) {}
