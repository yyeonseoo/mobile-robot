package com.temi.stamprally.ai;

public class AiNotConfiguredException extends RuntimeException {

  public AiNotConfiguredException() {
    super(
        "Claude API가 설정되지 않았습니다. 서버 환경변수 ANTHROPIC_API_KEY 또는"
            + " app.anthropic.api-key를 설정해 주세요.");
  }
}
