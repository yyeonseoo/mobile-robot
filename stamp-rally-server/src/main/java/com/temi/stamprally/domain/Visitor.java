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

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  protected Visitor() {}

  public static Visitor create() {
    return create(null);
  }

  public static Visitor create(String nickname) {
    Visitor v = new Visitor();
    v.token = UUID.randomUUID().toString();
    if (nickname != null) {
      String t = nickname.trim();
      if (!t.isEmpty()) {
        v.nickname = t.length() > 64 ? t.substring(0, 64) : t;
      }
    }
    return v;
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

  public Instant getCreatedAt() {
    return createdAt;
  }
}
