package com.temi.stamprally.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.temi.stamprally.web.dto.DailyChallengeResponse;
import com.temi.stamprally.web.dto.PokedexEntryResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class ClaudeAiService {

  private static final String ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
  private static final String ANTHROPIC_VERSION = "2023-06-01";
  private static final String POKE_ARTWORK =
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/%d.png";

  private static final String EVENT_CATALOG =
      """
      - 이브이즈 가든 파티 (14:00-17:00, 중앙 공원): 이브이·진화형, 간식·기념품
      - 메가 배틀 토너먼트 (19:00-22:00, 배틀 아레나): 배틀 대회, 트로피
      - 키즈 드로잉 클래스 (10:00-12:00, 아트 스튜디오): 포켓몬 그리기
      - 포켓몬 굿즈 페스티벌 (11:00-20:00, 메인 광장): 한정 굿즈·교환 부스
      """;

  private final AnthropicProperties properties;
  private final RestClient restClient;
  private final ObjectMapper objectMapper;

  public ClaudeAiService(AnthropicProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
    this.restClient = RestClient.builder().build();
  }

  public PokedexEntryResponse describePokemon(String query) {
    String q = query == null ? "" : query.trim();
    if (q.isEmpty()) {
      throw new IllegalArgumentException("포켓몬 이름 또는 도감 번호를 입력해 주세요.");
    }
    String system =
        """
        당신은 포켓몬 도감·질의응답 API입니다. 반드시 JSON 객체 하나만 출력하세요.
        마크다운, 코드블록, **굵게** 금지. 키는 영문, 값은 한국어 평문.

        사용자 입력에는 (1) 포켓몬 이름/번호만 있거나 (2) 포켓몬+질문이 함께 있을 수 있습니다.
        예: "피카츄", "피카츄는 진화하면 뭐가 돼?", "#025 특징"

        스키마:
        {
          "number": 전국도감번호(정수),
          "name": "질문에서 찾은 포켓몬 한글 이름",
          "category": "분류명",
          "types": ["전기"],
          "description": "도감 기본 설명 4~6문장. 특징·서식·TMI. 질문 답과 별개로 항상 채움.",
          "strongAgainst": ["물","비행"],
          "weakAgainst": ["땅"],
          "queryAnswer": "사용자 질문에 대한 직접 답변 2~5문장. 진화/기술/약점 등 질문에 맞게."
        }

        description은 항상 일반 도감 소개.
        queryAnswer는 입력 속 질문(진화, 강함, 잡는 법 등)에만 답하세요.
        이름만 입력됐으면 queryAnswer에 반가운 한 줄+가장 궁금해할 만한 한 가지 사실.
        모르는 포켓몬이면 number 0, queryAnswer에 솔직히 모른다고 안내.
        """;
    String user = "사용자 입력: " + q;
    String raw = complete(system, user);
    PokedexEntry entry = parsePokedexJson(raw);
    return toResponse(entry);
  }

  private PokedexEntry parsePokedexJson(String raw) {
    try {
      String json = extractJsonObject(raw);
      PokedexEntry entry = objectMapper.readValue(json, PokedexEntry.class);
      entry.setDescription(MarkdownStripper.strip(entry.getDescription()));
      entry.setName(MarkdownStripper.strip(entry.getName()));
      entry.setCategory(MarkdownStripper.strip(entry.getCategory()));
      entry.setTypes(normalizeTypeList(entry.getTypes()));
      entry.setStrongAgainst(normalizeTypeList(entry.getStrongAgainst()));
      entry.setWeakAgainst(normalizeTypeList(entry.getWeakAgainst()));
      entry.setQueryAnswer(MarkdownStripper.strip(entry.getQueryAnswer()));
      return entry;
    } catch (Exception e) {
      throw new IllegalStateException("도감 JSON 파싱 실패: " + e.getMessage(), e);
    }
  }

  private static String extractJsonObject(String text) {
    String t = text == null ? "" : text.trim();
    if (t.startsWith("```")) {
      int start = t.indexOf('\n');
      int end = t.lastIndexOf("```");
      if (start >= 0 && end > start) {
        t = t.substring(start + 1, end).trim();
      }
    }
    int i = t.indexOf('{');
    int j = t.lastIndexOf('}');
    if (i >= 0 && j > i) {
      return t.substring(i, j + 1);
    }
    return t;
  }

  private static List<String> normalizeTypeList(List<String> types) {
    if (types == null) {
      return List.of();
    }
    List<String> out = new ArrayList<>();
    for (String t : types) {
      if (t == null || t.isBlank()) {
        continue;
      }
      String n = MarkdownStripper.strip(t).replaceAll("(?i)타입$", "").trim();
      if (!n.isEmpty() && !out.contains(n)) {
        out.add(n);
      }
    }
    return out;
  }

  private PokedexEntryResponse toResponse(PokedexEntry entry) {
    int num = entry.getNumber() > 0 ? entry.getNumber() : 25;
    String imageUrl = num > 0 ? POKE_ARTWORK.formatted(num) : POKE_ARTWORK.formatted(25);
    return new PokedexEntryResponse(
        num,
        entry.getName().isBlank() ? "포켓몬" : entry.getName(),
        entry.getCategory(),
        entry.getTypes(),
        entry.getDescription(),
        entry.getStrongAgainst(),
        entry.getWeakAgainst(),
        imageUrl,
        entry.getQueryAnswer());
  }

  public DailyChallengeResponse generateDailyChallenge(String type, String topic) {
    String t = type == null ? "" : type.trim().toLowerCase();
    if (!t.matches("puzzle|race|quiz|memory")) {
      throw new IllegalArgumentException("챌린지 type은 puzzle, race, quiz, memory 중 하나입니다.");
    }
    String topicHint = topic == null || topic.isBlank() ? "포켓몬 페스티벌 인기 캐릭터" : topic.trim();

    String typeGuide =
        switch (t) {
          case "puzzle" ->
              """
              type=puzzle: 포켓몬 맞히기 수수께끼. body에 힌트만(정답 이름 직접 노출 금지).
              options에 포켓몬 이름 후보 4개 반드시 포함, answerIndex는 정답 인덱스(0~3).
              correctAnswer에 정답 포켓몬 한글 이름, hint에 해설. memoryCards 빈 배열.
              """;
          case "race" ->
              """
              type=race: 전시장 안에서 할 수 있는 스탬프 랠리형 미션(걷기·찾기). body에 3단계 미션.
              options/memoryCards 빈 배열, answerIndex=0.
              """;
          case "quiz" ->
              """
              type=quiz: 4지선다 포켓몬 퀴즈 1문항. body에 문제, options 4개(짧은 한국어),
              answerIndex는 정답 인덱스(0~3), hint에 해설 한 줄.
              """;
          case "memory" ->
              """
              type=memory: memoryCards에 포켓몬 이름 6개(한글, 왼쪽부터 순서).
              body에 순서 기억 규칙, timeLimitSec 초 기억 후 순서 입력 안내.
              correctAnswer에 memoryCards와 동일한 순서로 쉼표 구분 정답 문자열.
              options 빈 배열, answerIndex=0.
              """;
          default -> "";
        };

    String system =
        """
        당신은 2026 포켓몬 페스티벌 '일일 챌린지' 생성 API입니다.
        JSON 객체 하나만 출력하세요. 마크다운·코드블록·**굵게** 금지. 값은 한국어 평문.

        스키마:
        {
          "type": "puzzle|race|quiz|memory",
          "title": "챌린지 제목",
          "instruction": "참가 방법 2문장",
          "body": "본문(문제/미션/규칙)",
          "options": ["보기1","보기2","보기3","보기4"],
          "answerIndex": 0,
          "hint": "힌트 또는 해설",
          "memoryCards": ["단어1","단어2"],
          "rewardLabel": "+50P",
          "timeLimitSec": 60,
          "correctAnswer": "정답 포켓몬 이름(퍼즐·텍스트 제출용)"
        }
        """
            + typeGuide;

    String user = "오늘의 " + t + " 챌린지를 만들어 주세요. 주제 힌트: " + topicHint;
    String raw = complete(system, user);
    return toChallengeResponse(parseChallengeJson(raw, t));
  }

  private DailyChallengeContent parseChallengeJson(String raw, String expectedType) {
    try {
      DailyChallengeContent c = objectMapper.readValue(extractJsonObject(raw), DailyChallengeContent.class);
      c.setType(expectedType);
      c.setTitle(MarkdownStripper.strip(c.getTitle()));
      c.setInstruction(MarkdownStripper.strip(c.getInstruction()));
      c.setBody(MarkdownStripper.strip(c.getBody()));
      c.setHint(MarkdownStripper.strip(c.getHint()));
      c.setCorrectAnswer(MarkdownStripper.strip(c.getCorrectAnswer()));
      c.setRewardLabel(MarkdownStripper.strip(c.getRewardLabel()));
      if (c.getOptions() != null) {
        c.setOptions(
            c.getOptions().stream().map(MarkdownStripper::strip).filter(s -> !s.isBlank()).toList());
      }
      if (c.getMemoryCards() != null) {
        c.setMemoryCards(
            c.getMemoryCards().stream()
                .map(MarkdownStripper::strip)
                .filter(s -> !s.isBlank())
                .toList());
      }
      return c;
    } catch (Exception e) {
      throw new IllegalStateException("챌린지 JSON 파싱 실패: " + e.getMessage(), e);
    }
  }

  private DailyChallengeResponse toChallengeResponse(DailyChallengeContent c) {
    int answerIndex = c.getAnswerIndex();
    if (c.getOptions() != null && !c.getOptions().isEmpty()) {
      answerIndex = Math.max(0, Math.min(answerIndex, c.getOptions().size() - 1));
    } else {
      answerIndex = 0;
    }
    int timeLimit = c.getTimeLimitSec() > 0 ? c.getTimeLimitSec() : 60;
    String reward =
        c.getRewardLabel() == null || c.getRewardLabel().isBlank() ? "+50P" : c.getRewardLabel();
    String correctAnswer = c.getCorrectAnswer();
    if ((correctAnswer == null || correctAnswer.isBlank())
        && c.getOptions() != null
        && !c.getOptions().isEmpty()
        && answerIndex >= 0
        && answerIndex < c.getOptions().size()) {
      correctAnswer = c.getOptions().get(answerIndex);
    }
    return new DailyChallengeResponse(
        c.getType(),
        c.getTitle().isBlank() ? "오늘의 챌린지" : c.getTitle(),
        c.getInstruction(),
        c.getBody(),
        c.getOptions(),
        answerIndex,
        c.getHint(),
        c.getMemoryCards(),
        reward,
        timeLimit,
        correctAnswer != null ? correctAnswer : "");
  }

  public String recommendEvents(String interests, String companion) {
    String system =
        """
        당신은 포켓몬 페스티벌 이벤트 추천 AI입니다.
        아래 목록 안에서만 추천하세요. 없는 이벤트를 지어내지 마세요.
        """
            + EVENT_CATALOG
            + """
        
        한국어로 3개 이벤트를 순위(1~3)와 함께 추천하고, 각각 한 줄 이유·이동 장소를 적으세요.
        마지막에 한 문장으로 오늘 코스를 요약하세요.
        """;
    StringBuilder user = new StringBuilder("방문객 정보를 바탕으로 맞춤 이벤트를 추천해 주세요.\n");
    if (interests != null && !interests.isBlank()) {
      user.append("- 관심사: ").append(interests.trim()).append('\n');
    }
    if (companion != null && !companion.isBlank()) {
      user.append("- 동행: ").append(companion.trim()).append('\n');
    }
    if (user.length() < 60) {
      user.append("- 특별 입력 없음: 가족·친구와 즐기기 좋은 인기 이벤트 위주로 추천\n");
    }
    return complete(system, user.toString());
  }

  private String complete(String systemPrompt, String userMessage) {
    if (!properties.isConfigured()) {
      throw new AiNotConfiguredException();
    }
    Map<String, Object> body =
        Map.of(
            "model",
            properties.getModel(),
            "max_tokens",
            properties.getMaxTokens(),
            "system",
            systemPrompt,
            "messages",
            List.of(Map.of("role", "user", "content", userMessage)));

    // #region agent log
    DebugAgentLog.write(
        "B",
        "ClaudeAiService.complete:entry",
        "anthropic_request_start",
        Map.of("model", properties.getModel(), "maxTokens", properties.getMaxTokens()));
    // #endregion

    final int maxAttempts = 4;
    long backoffMs = 600L;
    RestClientResponseException lastHttpError = null;

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        String raw =
            restClient
                .post()
                .uri(ANTHROPIC_URL)
                .header("x-api-key", properties.getApiKey())
                .header("anthropic-version", ANTHROPIC_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        if (raw == null || raw.isBlank()) {
          throw new IllegalStateException("Claude API 응답이 비어 있습니다.");
        }
        JsonNode root = objectMapper.readTree(raw);
        JsonNode content = root.path("content");
        if (!content.isArray() || content.isEmpty()) {
          throw new IllegalStateException("Claude API 응답 형식이 올바르지 않습니다.");
        }
        String text = content.get(0).path("text").asText("");
        if (text.isBlank()) {
          throw new IllegalStateException("Claude가 빈 답변을 반환했습니다.");
        }
        // #region agent log
        DebugAgentLog.write(
            "A",
            "ClaudeAiService.complete:success",
            "anthropic_request_ok",
            Map.of("attempt", attempt, "textLen", text.length()));
        // #endregion
        return MarkdownStripper.strip(text.trim());
      } catch (RestClientResponseException e) {
        lastHttpError = e;
        int status = e.getStatusCode().value();
        boolean retryable = status == 529 || status == 503 || status == 502;
        // #region agent log
        DebugAgentLog.write(
            "A",
            "ClaudeAiService.complete:http_error",
            "anthropic_http_error",
            Map.of(
                "attempt",
                attempt,
                "status",
                status,
                "retryable",
                retryable,
                "bodySnippet",
                truncate(e.getResponseBodyAsString(), 200)));
        // #endregion
        if (retryable && attempt < maxAttempts) {
          try {
            Thread.sleep(backoffMs);
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            break;
          }
          backoffMs = Math.min(backoffMs * 2, 8000L);
          continue;
        }
        break;
      } catch (AiNotConfiguredException e) {
        throw e;
      } catch (Exception e) {
        if (e instanceof IllegalStateException ise) {
          throw ise;
        }
        throw new IllegalStateException("Claude API 처리 중 오류: " + e.getMessage(), e);
      }
    }

    if (lastHttpError != null) {
      int status = lastHttpError.getStatusCode().value();
      if (status == 529) {
        throw new IllegalStateException(
            "Claude API가 일시적으로 과부하 상태입니다(529). 잠시 후 다시 시도해 주세요.",
            lastHttpError);
      }
      throw new IllegalStateException(
          "Claude API 호출 실패 (" + status + "): " + truncate(lastHttpError.getResponseBodyAsString(), 120),
          lastHttpError);
    }
    throw new IllegalStateException("Claude API 호출에 실패했습니다.");
  }

  private static String truncate(String s, int max) {
    if (s == null) {
      return "";
    }
    return s.length() <= max ? s : s.substring(0, max) + "…";
  }
}
