package com.temi.stamprally.photobooth;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/photo-booth")
public class PhotoBoothController {

  private final PhotoBoothService photoBoothService;

  public PhotoBoothController(PhotoBoothService photoBoothService) {
    this.photoBoothService = photoBoothService;
  }

  @PostMapping("/sessions")
  public ResponseEntity<Map<String, Object>> createSession(HttpServletRequest request) throws IOException {
    PhotoBoothService.BoothSession session = photoBoothService.createSession(request);
    Map<String, Object> body = new HashMap<>();
    body.put("token", session.token());
    body.put("receiveUrl", session.receiveUrl());
    return ResponseEntity.ok(body);
  }

  @PostMapping("/sessions/{token}/photos")
  public ResponseEntity<Map<String, Object>> uploadPhoto(
      @PathVariable("token") String token, MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) {
      return ResponseEntity.badRequest().body(Map.of("error", "empty file"));
    }
    byte[] data = file.getBytes();
    int index = photoBoothService.savePhoto(token, data);
    return ResponseEntity.ok(Map.of("index", index, "saved", true));
  }

  @GetMapping("/sessions/{token}")
  public ResponseEntity<Map<String, Object>> sessionMeta(@PathVariable String token, HttpServletRequest request)
      throws IOException {
    PhotoBoothService.BoothSession session = photoBoothService.requireSession(token);
    List<String> photos = photoBoothService.photoUrls(token, request);
    return ResponseEntity.ok(
        Map.of(
            "token", session.token(),
            "receiveUrl", session.receiveUrl(),
            "photos", photos));
  }

  @GetMapping("/sessions/{token}/photo/{index}")
  public ResponseEntity<byte[]> downloadPhoto(@PathVariable String token, @PathVariable int index)
      throws IOException {
    byte[] bytes = photoBoothService.readPhoto(token, index);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
        .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
        .body(bytes);
  }

  @GetMapping("/sessions/{token}/qr.png")
  public ResponseEntity<byte[]> qr(@PathVariable String token, HttpServletRequest request) {
    byte[] png = photoBoothService.qrPng(token, request);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(png);
  }
}
