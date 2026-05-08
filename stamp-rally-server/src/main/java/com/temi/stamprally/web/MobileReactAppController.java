package com.temi.stamprally.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MobileReactAppController {

  @GetMapping({"/mobile/app", "/mobile/app/"})
  public String mobileReactAppIndex() {
    return "forward:/mobile/app/index.html";
  }

  // SPA 라우트들만 index.html로 포워딩 (정적 파일 경로까지 잡으면 무한 포워딩/500 발생)
  @GetMapping({
    "/mobile/app/map",
    "/mobile/app/rally",
    "/mobile/app/camera",
    "/mobile/app/scan",
    "/mobile/app/profile",
    "/mobile/app/enter",
    "/mobile/app/photo/receive"
  })
  public String mobileReactAppSpaRoutes() {
    return "forward:/mobile/app/index.html";
  }
}

