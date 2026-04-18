package com.temi.stamprally.web;

import com.temi.stamprally.service.StampRallyService;
import com.temi.stamprally.web.dto.RallyMetaResponse;
import com.temi.stamprally.web.dto.RallyStatusResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rally")
public class RallyController {

  private final StampRallyService stampRallyService;

  public RallyController(StampRallyService stampRallyService) {
    this.stampRallyService = stampRallyService;
  }

  @GetMapping("/meta")
  public RallyMetaResponse meta() {
    return stampRallyService.rallyMeta();
  }

  @GetMapping("/status")
  public RallyStatusResponse status(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken) {
    return stampRallyService.rallyStatus(visitorToken);
  }
}
