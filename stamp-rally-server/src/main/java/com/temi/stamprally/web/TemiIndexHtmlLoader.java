package com.temi.stamprally.web;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/** 개발 시에는 디스크의 index.html을, 없으면 classpath를 읽습니다. */
@Component
public class TemiIndexHtmlLoader {

  private static final String CLASSPATH = "static/temi/index.html";

  public String loadRawHtml() throws IOException {
    String root = System.getProperty("user.dir", ".");
    Path[] candidates = {
      Path.of(root).resolve("src/main/resources/static/temi/index.html"),
      Path.of(root).resolve("stamp-rally-server/src/main/resources/static/temi/index.html")
    };
    for (Path source : candidates) {
      Path normalized = source.normalize();
      if (Files.isRegularFile(normalized)) {
        return Files.readString(normalized, StandardCharsets.UTF_8);
      }
    }
    var res = new ClassPathResource(CLASSPATH);
    if (!res.exists()) {
      throw new IOException("Missing classpath resource: " + CLASSPATH);
    }
    try (var in = res.getInputStream()) {
      return new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
  }
}
