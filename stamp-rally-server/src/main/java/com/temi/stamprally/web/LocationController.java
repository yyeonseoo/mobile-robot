package com.temi.stamprally.web;

import com.temi.stamprally.service.StampRallyService;
import com.temi.stamprally.web.dto.LocationRequest;
import com.temi.stamprally.web.dto.LocationResultResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/location")
public class LocationController {

  public static final String VISITOR_TOKEN_HEADER = "X-Visitor-Token";

  private final StampRallyService stampRallyService;

  public LocationController(StampRallyService stampRallyService) {
    this.stampRallyService = stampRallyService;
  }

  /**
   * 이동 중 주기적으로 호출: GPS(또는 Temi pose를 WGS84로 변환한 좌표)를 주면 반경 내 스팟 스탬프
   * 적립.
   */
  @PostMapping
  public LocationResultResponse submit(
      @RequestHeader(VISITOR_TOKEN_HEADER) String visitorToken,
      @Valid @RequestBody LocationRequest body) {
    return stampRallyService.processLocation(
        visitorToken, body.latitude(), body.longitude());
  }
}
