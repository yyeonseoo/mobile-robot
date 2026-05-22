package com.temi.stamprally.web.dto;

import java.util.List;

public record DailyChallengeResponse(
    String type,
    String title,
    String instruction,
    String body,
    List<String> options,
    int answerIndex,
    String hint,
    List<String> memoryCards,
    String rewardLabel,
    int timeLimitSec,
    /** 선택지 없을 때 텍스트 정답 (퍼즐) */
    String correctAnswer) {}
