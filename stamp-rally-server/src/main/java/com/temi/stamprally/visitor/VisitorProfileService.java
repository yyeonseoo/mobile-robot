package com.temi.stamprally.visitor;

import com.temi.stamprally.domain.QuizChallengeRecord;
import com.temi.stamprally.domain.Visitor;
import com.temi.stamprally.domain.VisitorPhoto;
import com.temi.stamprally.repo.QuizChallengeRecordRepository;
import com.temi.stamprally.repo.VisitorPhotoRepository;
import com.temi.stamprally.repo.VisitorRepository;
import com.temi.stamprally.web.dto.QuizChallengeRecordResponse;
import com.temi.stamprally.web.dto.QuizChallengeSubmitRequest;
import com.temi.stamprally.web.dto.QuizXpResponse;
import com.temi.stamprally.web.dto.VisitorPhotoResponse;
import com.temi.stamprally.web.dto.VisitorProfileResponse;
import com.temi.stamprally.web.dto.VisitorSessionResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VisitorProfileService {

  private static final Pattern KOREAN_PHONE = Pattern.compile("^01[016789]\\d{7,8}$");

  private final VisitorRepository visitorRepository;
  private final VisitorPhotoRepository visitorPhotoRepository;
  private final QuizChallengeRecordRepository quizChallengeRecordRepository;
  private final Path storageRoot;

  public VisitorProfileService(
      VisitorRepository visitorRepository,
      VisitorPhotoRepository visitorPhotoRepository,
      QuizChallengeRecordRepository quizChallengeRecordRepository,
      VisitorProfileProperties properties)
      throws IOException {
    this.visitorRepository = visitorRepository;
    this.visitorPhotoRepository = visitorPhotoRepository;
    this.quizChallengeRecordRepository = quizChallengeRecordRepository;
    if (StringUtils.hasText(properties.getStorageDir())) {
      this.storageRoot = Path.of(properties.getStorageDir()).toAbsolutePath().normalize();
    } else {
      this.storageRoot =
          Path.of(System.getProperty("java.io.tmpdir"), "stamprally-visitor-photos")
              .toAbsolutePath()
              .normalize();
    }
    Files.createDirectories(this.storageRoot);
  }

  @Transactional
  public VisitorSessionResponse createVisitor(String nickname, String phoneNumber) {
    String nick = requireNickname(nickname);
    String phone = requirePhone(phoneNumber);
    Visitor v = Visitor.create(nick, phone);
    visitorRepository.save(v);
    return toSessionResponse(v);
  }

  @Transactional(readOnly = true)
  public VisitorProfileResponse getProfile(String token) {
    Visitor v = findVisitor(token);
    List<QuizChallengeRecordResponse> recent =
        quizChallengeRecordRepository.findTop20ByVisitorOrderByAnsweredAtDesc(v).stream()
            .map(this::toChallengeResponse)
            .toList();
    return new VisitorProfileResponse(
        v.getToken(),
        v.getNickname(),
        v.getPhoneNumber(),
        v.getQuizXp(),
        visitorPhotoRepository.countByVisitor(v),
        recent);
  }

  @Transactional
  public QuizXpResponse submitChallenge(String token, QuizChallengeSubmitRequest body) {
    if (body == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "body required");
    }
    Visitor v = findVisitor(token);
    int xp = Math.max(0, body.xpGained());
    QuizChallengeRecord record =
        QuizChallengeRecord.create(
            v, body.challengeType(), body.title(), body.correct(), xp);
    quizChallengeRecordRepository.save(record);
    v.addQuizXp(xp);
    visitorRepository.save(v);
    return new QuizXpResponse(v.getQuizXp());
  }

  @Transactional
  public QuizXpResponse syncQuizXp(String token, int totalXp) {
    Visitor v = findVisitor(token);
    int safe = Math.max(0, totalXp);
    if (safe > v.getQuizXp()) {
      v.addQuizXp(safe - v.getQuizXp());
      visitorRepository.save(v);
    }
    return new QuizXpResponse(v.getQuizXp());
  }

  @Transactional
  public VisitorPhotoResponse savePhoto(String token, String dataUrl, String kind) {
    if (!StringUtils.hasText(dataUrl)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dataUrl required");
    }
    Visitor v = findVisitor(token);
    byte[] bytes = decodeDataUrl(dataUrl.trim());
    if (bytes.length > 20 * 1024 * 1024) {
      throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "image too large");
    }
    String safeKind = normalizeKind(kind);
    Path visitorDir = storageRoot.resolve(String.valueOf(v.getId()));
    try {
      Files.createDirectories(visitorDir);
      String fileName = System.currentTimeMillis() + "-" + safeKind + ".png";
      Path file = visitorDir.resolve(fileName);
      Files.write(file, bytes);
      VisitorPhoto photo = VisitorPhoto.create(v, safeKind, file.toString());
      visitorPhotoRepository.save(photo);
      return toPhotoResponse(photo);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "failed to save photo");
    }
  }

  @Transactional(readOnly = true)
  public List<VisitorPhotoResponse> listPhotos(String token) {
    Visitor v = findVisitor(token);
    return visitorPhotoRepository.findByVisitorOrderByCreatedAtDesc(v).stream()
        .map(this::toPhotoResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public Path resolvePhotoFile(String token, long photoId) {
    Visitor v = findVisitor(token);
    VisitorPhoto photo =
        visitorPhotoRepository
            .findById(photoId)
            .filter(p -> p.getVisitor().getId().equals(v.getId()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "photo not found"));
    Path path = Path.of(photo.getStoragePath());
    if (!Files.isRegularFile(path)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "photo file missing");
    }
    return path;
  }

  private Visitor findVisitor(String token) {
    if (!StringUtils.hasText(token)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "missing visitor token");
    }
    return visitorRepository
        .findByToken(token.trim())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "unknown visitor"));
  }

  private static String requireNickname(String nickname) {
    if (!StringUtils.hasText(nickname)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nickname required");
    }
    String t = nickname.trim();
    if (t.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nickname required");
    }
    return t.length() > 64 ? t.substring(0, 64) : t;
  }

  private static String requirePhone(String phoneNumber) {
    if (!StringUtils.hasText(phoneNumber)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "phoneNumber required");
    }
    String digits = phoneNumber.replaceAll("\\D", "");
    if (!KOREAN_PHONE.matcher(digits).matches()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "phoneNumber must be a valid Korean mobile number");
    }
    return digits;
  }

  private static String normalizeKind(String kind) {
    if (!StringUtils.hasText(kind)) {
      return "strip";
    }
    String k = kind.trim().toLowerCase(Locale.ROOT);
    if (k.length() > 32) {
      k = k.substring(0, 32);
    }
    return k.replaceAll("[^a-z0-9_-]", "");
  }

  private static byte[] decodeDataUrl(String dataUrl) {
    String payload = dataUrl;
    int comma = dataUrl.indexOf(',');
    if (dataUrl.startsWith("data:") && comma > 0) {
      payload = dataUrl.substring(comma + 1);
    }
    try {
      return Base64.getDecoder().decode(payload);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid image data");
    }
  }

  private VisitorSessionResponse toSessionResponse(Visitor v) {
    return new VisitorSessionResponse(v.getToken(), v.getNickname(), v.getPhoneNumber(), v.getQuizXp());
  }

  private QuizChallengeRecordResponse toChallengeResponse(QuizChallengeRecord r) {
    return new QuizChallengeRecordResponse(
        r.getId(),
        r.getChallengeType(),
        r.getTitle(),
        r.isCorrect(),
        r.getXpGained(),
        r.getAnsweredAt().toString());
  }

  private VisitorPhotoResponse toPhotoResponse(VisitorPhoto p) {
    return new VisitorPhotoResponse(
        p.getId(),
        p.getKind(),
        "/api/visitor/photos/" + p.getId() + "/image",
        p.getCreatedAt().toString());
  }
}
