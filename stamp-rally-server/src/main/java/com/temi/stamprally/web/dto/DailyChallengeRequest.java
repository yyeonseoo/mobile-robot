package com.temi.stamprally.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DailyChallengeRequest(
    @NotBlank
        @Pattern(regexp = "puzzle|race|quiz|memory", message = "type은 puzzle, race, quiz, memory 중 하나여야 합니다.")
        String type,
    @Size(max = 120) String topic) {}
