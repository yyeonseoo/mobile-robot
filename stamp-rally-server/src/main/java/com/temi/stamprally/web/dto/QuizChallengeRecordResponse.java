package com.temi.stamprally.web.dto;

public record QuizChallengeRecordResponse(
    long id,
    String challengeType,
    String title,
    boolean correct,
    int xpGained,
    String answeredAt) {}
