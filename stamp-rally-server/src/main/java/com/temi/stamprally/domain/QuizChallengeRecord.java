package com.temi.stamprally.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "quiz_challenge_records")
public class QuizChallengeRecord {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "visitor_id", nullable = false)
  private Visitor visitor;

  @Column(nullable = false, length = 32)
  private String challengeType;

  @Column(length = 128)
  private String title;

  @Column(nullable = false)
  private boolean correct;

  @Column(nullable = false)
  private int xpGained;

  @Column(nullable = false)
  private Instant answeredAt = Instant.now();

  protected QuizChallengeRecord() {}

  public static QuizChallengeRecord create(
      Visitor visitor, String challengeType, String title, boolean correct, int xpGained) {
    QuizChallengeRecord r = new QuizChallengeRecord();
    r.visitor = visitor;
    r.challengeType = challengeType != null ? challengeType.trim() : "quiz";
    if (r.challengeType.length() > 32) {
      r.challengeType = r.challengeType.substring(0, 32);
    }
    if (title != null) {
      String t = title.trim();
      r.title = t.length() > 128 ? t.substring(0, 128) : t;
    }
    r.correct = correct;
    r.xpGained = Math.max(0, xpGained);
    return r;
  }

  public Long getId() {
    return id;
  }

  public String getChallengeType() {
    return challengeType;
  }

  public String getTitle() {
    return title;
  }

  public boolean isCorrect() {
    return correct;
  }

  public int getXpGained() {
    return xpGained;
  }

  public Instant getAnsweredAt() {
    return answeredAt;
  }
}
