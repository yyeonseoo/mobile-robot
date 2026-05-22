package com.temi.stamprally.web.dto;

import java.util.List;

/** Claude 도감 + PokeAPI 스프라이트용 구조화 응답 */
public record PokedexEntryResponse(
    int number,
    String name,
    String category,
    List<String> types,
    String description,
    List<String> strongAgainst,
    List<String> weakAgainst,
    String imageUrl,
    /** 사용자 질문에 대한 직접 답변 */
    String queryAnswer) {}
