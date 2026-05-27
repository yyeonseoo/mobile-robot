package com.temi.stamprally.web.dto;

import java.util.List;

public record VisitorProfileResponse(
    String visitorToken,
    String nickname,
    String phoneNumber,
    int quizXp,
    long photoCount,
    List<QuizChallengeRecordResponse> recentChallenges,
    List<VisitorEventActionResponse> eventActions) {}
