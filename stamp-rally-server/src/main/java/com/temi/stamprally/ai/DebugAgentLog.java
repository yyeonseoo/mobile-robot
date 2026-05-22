package com.temi.stamprally.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.LinkedHashMap;
import java.util.Map;

/** Debug-mode NDJSON logger (session 351488). Remove after verification. */
final class DebugAgentLog {

  private static final Path LOG_PATH =
      Path.of(
          "/Users/LEEJIWOO/Desktop/대학교폴더/3학년 1학기/테미_모바일로봇/.cursor/debug-351488.log");
  private static final ObjectMapper MAPPER = new ObjectMapper();

  private DebugAgentLog() {}

  static void write(String hypothesisId, String location, String message, Map<String, Object> data) {
    try {
      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("sessionId", "351488");
      payload.put("hypothesisId", hypothesisId);
      payload.put("location", location);
      payload.put("message", message);
      payload.put("data", data != null ? data : Map.of());
      payload.put("timestamp", System.currentTimeMillis());
      String line = MAPPER.writeValueAsString(payload) + System.lineSeparator();
      Files.writeString(LOG_PATH, line, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    } catch (Exception ignored) {
      // debug-only
    }
  }
}
