package com.temi.stamprally.web;

import com.temi.stamprally.visitor.VisitorProfileService;
import com.temi.stamprally.web.dto.QuizChallengeSubmitRequest;
import com.temi.stamprally.web.dto.QuizXpResponse;
import com.temi.stamprally.web.dto.QuizXpSyncRequest;
import com.temi.stamprally.web.dto.VisitorEventActionRequest;
import com.temi.stamprally.web.dto.VisitorEventActionResponse;
import com.temi.stamprally.web.dto.VisitorPhotoResponse;
import com.temi.stamprally.web.dto.VisitorPhotoUploadRequest;
import com.temi.stamprally.web.dto.VisitorProfileResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visitor")
public class VisitorController {

  private final VisitorProfileService visitorProfileService;

  public VisitorController(VisitorProfileService visitorProfileService) {
    this.visitorProfileService = visitorProfileService;
  }

  @GetMapping("/me")
  public VisitorProfileResponse me(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken) {
    return visitorProfileService.getProfile(visitorToken);
  }

  @PostMapping("/quiz-results")
  public QuizXpResponse submitQuiz(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken,
      @RequestBody QuizChallengeSubmitRequest body) {
    return visitorProfileService.submitChallenge(visitorToken, body);
  }

  @PostMapping("/quiz-xp/sync")
  public QuizXpResponse syncQuizXp(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken,
      @RequestBody QuizXpSyncRequest body) {
    int total = body != null ? body.totalXp() : 0;
    return visitorProfileService.syncQuizXp(visitorToken, total);
  }

  @PostMapping("/event-actions")
  @ResponseStatus(HttpStatus.CREATED)
  public VisitorEventActionResponse saveEventAction(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken,
      @RequestBody VisitorEventActionRequest body) {
    return visitorProfileService.saveEventAction(visitorToken, body);
  }

  @GetMapping("/event-actions")
  public List<VisitorEventActionResponse> listEventActions(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken) {
    return visitorProfileService.listEventActions(visitorToken);
  }

  @PostMapping("/photos")
  @ResponseStatus(HttpStatus.CREATED)
  public VisitorPhotoResponse uploadPhoto(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken,
      @RequestBody VisitorPhotoUploadRequest body) {
    String dataUrl = body != null ? body.dataUrl() : null;
    String kind = body != null ? body.kind() : null;
    return visitorProfileService.savePhoto(visitorToken, dataUrl, kind);
  }

  @GetMapping("/photos")
  public List<VisitorPhotoResponse> listPhotos(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken) {
    return visitorProfileService.listPhotos(visitorToken);
  }

  @GetMapping("/photos/{id}/image")
  public ResponseEntity<Resource> photoImage(
      @RequestHeader(LocationController.VISITOR_TOKEN_HEADER) String visitorToken,
      @PathVariable long id)
      throws IOException {
    Path file = visitorProfileService.resolvePhotoFile(visitorToken, id);
    FileSystemResource resource = new FileSystemResource(file);
    return ResponseEntity.ok()
        .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
        .contentType(MediaType.IMAGE_PNG)
        .contentLength(Files.size(file))
        .body(resource);
  }
}
