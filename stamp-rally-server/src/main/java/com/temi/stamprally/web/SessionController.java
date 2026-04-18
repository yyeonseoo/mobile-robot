package com.temi.stamprally.web;

import com.temi.stamprally.service.StampRallyService;
import com.temi.stamprally.web.dto.CreateSessionRequest;
import com.temi.stamprally.web.dto.VisitorSessionResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

  private final StampRallyService stampRallyService;

  public SessionController(StampRallyService stampRallyService) {
    this.stampRallyService = stampRallyService;
  }

  /** 참가 시작 — 폰/로봇 클라이언트가 받아서 저장할 visitorToken 발급 */
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public VisitorSessionResponse createSession(
      @RequestBody(required = false) CreateSessionRequest body) {
    String nickname = body != null ? body.nickname() : null;
    return stampRallyService.createVisitor(nickname);
  }
}
