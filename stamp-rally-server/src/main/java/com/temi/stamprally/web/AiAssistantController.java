package com.temi.stamprally.web;

import com.temi.stamprally.ai.AiNotConfiguredException;
import com.temi.stamprally.ai.ClaudeAiService;
import com.temi.stamprally.web.dto.AiMessageResponse;
import com.temi.stamprally.web.dto.DailyChallengeRequest;
import com.temi.stamprally.web.dto.DailyChallengeResponse;
import com.temi.stamprally.web.dto.EventRecommendRequest;
import com.temi.stamprally.web.dto.PokedexEntryResponse;
import com.temi.stamprally.web.dto.PokedexQueryRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiAssistantController {

  private final ClaudeAiService claudeAiService;

  public AiAssistantController(ClaudeAiService claudeAiService) {
    this.claudeAiService = claudeAiService;
  }

  /** 포켓몬 도감 설명 (Claude) */
  @PostMapping("/pokedex")
  public PokedexEntryResponse pokedex(@Valid @RequestBody PokedexQueryRequest body) {
    return claudeAiService.describePokemon(body.query());
  }

  /** 현장 이벤트 맞춤 추천 (Claude) */
  @PostMapping("/events/recommend")
  public AiMessageResponse recommendEvents(@Valid @RequestBody EventRecommendRequest body) {
    return new AiMessageResponse(
        claudeAiService.recommendEvents(body.interests(), body.companion()));
  }

  /** 일일 챌린지 — 퍼즐·레이스·퀴즈·메모리 */
  @PostMapping("/challenges/daily")
  public DailyChallengeResponse dailyChallenge(@Valid @RequestBody DailyChallengeRequest body) {
    return claudeAiService.generateDailyChallenge(body.type(), body.topic());
  }

  @ExceptionHandler(AiNotConfiguredException.class)
  public ResponseEntity<Map<String, String>> notConfigured(AiNotConfiguredException ex) {
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(Map.of("error", ex.getMessage()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, String>> aiError(IllegalStateException ex) {
    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .body(Map.of("error", ex.getMessage()));
  }
}
