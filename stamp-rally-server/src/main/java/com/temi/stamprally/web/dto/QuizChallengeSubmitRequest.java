package com.temi.stamprally.web.dto;

public record QuizChallengeSubmitRequest(
    String challengeType, String title, boolean correct, int xpGained) {}
