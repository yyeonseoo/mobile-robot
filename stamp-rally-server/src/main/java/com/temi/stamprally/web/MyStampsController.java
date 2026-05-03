package com.temi.stamprally.web;

import com.temi.stamprally.service.StampRallyService;
import com.temi.stamprally.web.dto.CollectedStampResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/my-stamps")
public class MyStampsController {

  private final StampRallyService stampRallyService;

  public MyStampsController(StampRallyService stampRallyService) {
    this.stampRallyService = stampRallyService;
  }

  @GetMapping
  public List<CollectedStampResponse> list(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken) {
    return stampRallyService.listCollected(visitorToken);
  }
}
