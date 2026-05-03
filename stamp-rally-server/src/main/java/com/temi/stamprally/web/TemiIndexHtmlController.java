package com.temi.stamprally.web;

import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 테미 홈 HTML을 여기서 내려주면, 매 요청마다 CSS 쿼리 버전을 바꿔 브라우저·웹뷰 캐시를 뚫을 수 있습니다.
 * HTML은 가능하면 디스크 소스(src/main/resources/...)를 읽어 저장 직후에도 반영되게 합니다.
 */
@Controller
public class TemiIndexHtmlController {

  private static final String PLACEHOLDER = "__ASSET_VERSION__";

  private final TemiIndexHtmlLoader indexHtmlLoader;

  @Value("${app.temi-index-bust-asset-cache:true}")
  private boolean bustAssetCache;

  @Value("${app.asset-version:1}")
  private String staticAssetVersion;

  public TemiIndexHtmlController(TemiIndexHtmlLoader indexHtmlLoader) {
    this.indexHtmlLoader = indexHtmlLoader;
  }

  @GetMapping(value = "/temi/index.html", produces = "text/html;charset=UTF-8")
  public ResponseEntity<String> temiIndex() {
    String html;
    try {
      html = indexHtmlLoader.loadRawHtml();
    } catch (IOException e) {
      return ResponseEntity.notFound().build();
    }
    String version = bustAssetCache ? String.valueOf(System.currentTimeMillis()) : staticAssetVersion;
    html = html.replace(PLACEHOLDER, version);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
        .header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        .header("Pragma", "no-cache")
        .body(html);
  }
}
