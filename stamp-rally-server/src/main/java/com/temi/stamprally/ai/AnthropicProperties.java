package com.temi.stamprally.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.anthropic")
public class AnthropicProperties {

  /** API 키 — 환경변수 ANTHROPIC_API_KEY 권장 */
  private String apiKey = "";

  private String model = "claude-haiku-4-5-20251001";

  private int maxTokens = 1024;

  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }

  public int getMaxTokens() {
    return maxTokens;
  }

  public void setMaxTokens(int maxTokens) {
    this.maxTokens = maxTokens;
  }

  public boolean isConfigured() {
    return apiKey != null && !apiKey.isBlank();
  }
}
