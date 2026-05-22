package com.temi.stamprally.ai;

/** Claude 응답에서 마크다운 장식 제거 */
public final class MarkdownStripper {

  private MarkdownStripper() {}

  public static String strip(String text) {
    if (text == null || text.isBlank()) {
      return "";
    }
    String s = text.trim();
    s = s.replaceAll("\\*\\*([^*]+)\\*\\*", "$1");
    s = s.replaceAll("\\*([^*]+)\\*", "$1");
    s = s.replaceAll("(?m)^#+\\s*", "");
    s = s.replaceAll("`([^`]+)`", "$1");
    s = s.replaceAll("(?m)^[-*]\\s+", "");
    return s.trim();
  }
}
