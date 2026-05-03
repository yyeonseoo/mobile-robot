package com.temi.stamprally.web.dto;

import java.util.List;

public record LocationResultResponse(
    List<StampSpotResponse> newlyCollected, int totalCollectedCount) {}
