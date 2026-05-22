package com.temi.stamprally.web.dto;

public record VisitorSessionResponse(
    String visitorToken, String nickname, String phoneNumber, int quizXp) {}
