package com.temi.stamprally.web;

import com.temi.stamprally.service.StampRallyService;
import com.temi.stamprally.web.dto.StampClaimRequest;
import com.temi.stamprally.web.dto.StampClaimResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stamps")
public class StampClaimController {

  private final StampRallyService stampRallyService;

  public StampClaimController(StampRallyService stampRallyService) {
    this.stampRallyService = stampRallyService;
  }

  /** QR에 인쇄된 코드(스팟 code와 동일)로 스탬프 적립 */
  @PostMapping("/claim")
  public StampClaimResponse claim(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken,
      @Valid @RequestBody StampClaimRequest body) {
    return stampRallyService.claimByQr(visitorToken, body.qrValue());
  }
}
