package com.temi.stamprally.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "visitors")
public class Visitor {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 36)
  private String token;

  @Column(length = 64)
  private String nickname;

  @Column(length = 20)
  private String phoneNumber;

  @Column(nullable = false)
  private int quizXp = 0;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected Visitor() {}

  public static Visitor create(String nickname, String phoneNumber) {
    Visitor v = new Visitor();
    v.token = UUID.randomUUID().toString();
    v.setNickname(nickname);
    v.setPhoneNumber(phoneNumber);
    return v;
  }

  public void setNickname(String nickname) {
    if (nickname == null) {
      this.nickname = null;
      return;
    }
    String t = nickname.trim();
    this.nickname = t.isEmpty() ? null : (t.length() > 64 ? t.substring(0, 64) : t);
  }

  public void setPhoneNumber(String phoneNumber) {
    if (phoneNumber == null) {
      this.phoneNumber = null;
      return;
    }
    String digits = phoneNumber.replaceAll("\\D", "");
    this.phoneNumber = digits.isEmpty() ? null : (digits.length() > 20 ? digits.substring(0, 20) : digits);
  }

  public void addQuizXp(int delta) {
    if (delta <= 0) {
      return;
    }
    long next = (long) this.quizXp + delta;
    this.quizXp = next > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) next;
  }

  public Long getId() {
    return id;
  }

  public String getToken() {
    return token;
  }

  public String getNickname() {
    return nickname;
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public int getQuizXp() {
    return quizXp;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
