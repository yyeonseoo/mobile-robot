package com.temi.stamprally.photobooth;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PhotoBoothService {

  private static final Pattern TOKEN = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");

  private final PhotoBoothProperties properties;
  private final Path storageRoot;
  private final ConcurrentHashMap<String, BoothSession> sessions = new ConcurrentHashMap<>();

  public PhotoBoothService(PhotoBoothProperties properties) throws IOException {
    this.properties = properties;
    if (StringUtils.hasText(properties.getStorageDir())) {
      this.storageRoot = Path.of(properties.getStorageDir()).toAbsolutePath().normalize();
    } else {
      this.storageRoot = Path.of(System.getProperty("java.io.tmpdir"), "stamprally-photo-booth").toAbsolutePath().normalize();
    }
    Files.createDirectories(this.storageRoot);
  }

  public BoothSession createSession(HttpServletRequest request) throws IOException {
    String token = UUID.randomUUID().toString();
    Path dir = storageRoot.resolve(token);
    Files.createDirectories(dir);
    String base = PublicBaseUrlResolver.resolve(properties.getPublicBaseUrl(), request);
    String receiveUrl = base + "/mobile/photo-receive.html?token=" + token;
    BoothSession session = new BoothSession(token, receiveUrl, dir, Instant.now(), new AtomicInteger(0));
    sessions.put(token, session);
    return session;
  }

  public int savePhoto(String token, byte[] data) throws IOException {
    BoothSession session = requireSession(token);
    int index = session.nextIndex().getAndIncrement();
    Path file = session.dir().resolve(String.format("%04d.png", index));
    Files.write(file, data);
    return index;
  }

  public List<Integer> listPhotoIndices(String token) throws IOException {
    BoothSession session = requireSession(token);
    try (Stream<Path> stream = Files.list(session.dir())) {
      return stream
          .filter(p -> p.getFileName().toString().matches("\\d{4}\\.png"))
          .map(p -> p.getFileName().toString().replace(".png", ""))
          .map(Integer::parseInt)
          .sorted(Comparator.naturalOrder())
          .toList();
    }
  }

  public byte[] readPhoto(String token, int index) throws IOException {
    BoothSession session = requireSession(token);
    Path file = session.dir().resolve(String.format("%04d.png", index));
    if (!Files.isRegularFile(file)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    return Files.readAllBytes(file);
  }

  public byte[] qrPng(String token, HttpServletRequest request) {
    BoothSession session = sessions.get(token);
    if (session == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    String url = session.receiveUrl();
    try {
      QRCodeWriter writer = new QRCodeWriter();
      BitMatrix matrix = writer.encode(url, BarcodeFormat.QR_CODE, 360, 360);
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(matrix, "PNG", out);
      return out.toByteArray();
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "QR failed", e);
    }
  }

  public BoothSession requireSession(String token) {
    validateToken(token);
    BoothSession s = sessions.get(token);
    if (s == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown session");
    }
    return s;
  }

  public void validateToken(String token) {
    if (token == null || !TOKEN.matcher(token).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid token");
    }
  }

  public List<String> photoUrls(String token, HttpServletRequest request) throws IOException {
    requireSession(token);
    List<Integer> indices = listPhotoIndices(token);
    String ctx = request.getContextPath() == null ? "" : request.getContextPath();
    List<String> urls = new ArrayList<>();
    for (Integer i : indices) {
      urls.add(ctx + "/api/photo-booth/sessions/" + token + "/photo/" + i);
    }
    return urls;
  }

  public record BoothSession(
      String token, String receiveUrl, Path dir, Instant createdAt, AtomicInteger nextIndex) {}
}
