package com.temi.stamprally.web;

import com.temi.stamprally.service.StampRallyService;
import com.temi.stamprally.web.dto.StampSpotResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/spots")
public class SpotsController {

  private final StampRallyService stampRallyService;

  public SpotsController(StampRallyService stampRallyService) {
    this.stampRallyService = stampRallyService;
  }

  /** 전체 스탬프 존(지도 표시·관리용) */
  @GetMapping
  public List<StampSpotResponse> all() {
    return stampRallyService.listAllSpots();
  }
}
