package com.temi.stamprally.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DailyChallengeContent {

  private String type = "";
  private String title = "";
  private String instruction = "";
  private String body = "";
  private List<String> options = List.of();
  private int answerIndex = 0;
  private String hint = "";
  private List<String> memoryCards = List.of();
  private String rewardLabel = "+50P";
  private int timeLimitSec = 60;
  private String correctAnswer = "";

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getInstruction() {
    return instruction;
  }

  public void setInstruction(String instruction) {
    this.instruction = instruction;
  }

  public String getBody() {
    return body;
  }

  public void setBody(String body) {
    this.body = body;
  }

  public List<String> getOptions() {
    return options;
  }

  public void setOptions(List<String> options) {
    this.options = options != null ? options : List.of();
  }

  public int getAnswerIndex() {
    return answerIndex;
  }

  public void setAnswerIndex(int answerIndex) {
    this.answerIndex = answerIndex;
  }

  public String getHint() {
    return hint;
  }

  public void setHint(String hint) {
    this.hint = hint;
  }

  public List<String> getMemoryCards() {
    return memoryCards;
  }

  public void setMemoryCards(List<String> memoryCards) {
    this.memoryCards = memoryCards != null ? memoryCards : List.of();
  }

  public String getRewardLabel() {
    return rewardLabel;
  }

  public void setRewardLabel(String rewardLabel) {
    this.rewardLabel = rewardLabel;
  }

  public int getTimeLimitSec() {
    return timeLimitSec;
  }

  public void setTimeLimitSec(int timeLimitSec) {
    this.timeLimitSec = timeLimitSec;
  }

  public String getCorrectAnswer() {
    return correctAnswer;
  }

  public void setCorrectAnswer(String correctAnswer) {
    this.correctAnswer = correctAnswer;
  }
}
