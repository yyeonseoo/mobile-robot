package com.temi.stamprally.web.dto;

/** 기기 localStorage에 있던 XP를 서버에 한 번 합칠 때 */
public record QuizXpSyncRequest(int totalXp) {}
