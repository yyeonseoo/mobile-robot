package com.temi.stamprally.photobooth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import org.springframework.util.StringUtils;

final class PublicBaseUrlResolver {

  private PublicBaseUrlResolver() {}

  static String resolve(String configuredBase, HttpServletRequest request) {
    if (StringUtils.hasText(configuredBase)) {
      return stripTrailingSlash(configuredBase.trim());
    }
    String scheme = firstNonBlank(request.getHeader("X-Forwarded-Proto"), request.getScheme());
    String hostHeader = request.getHeader("X-Forwarded-Host");
    String authority;
    if (StringUtils.hasText(hostHeader)) {
      authority = hostHeader.split(",")[0].trim();
    } else {
      int port = request.getServerPort();
      String host = request.getServerName();
      boolean defaultPort =
          ("http".equalsIgnoreCase(scheme) && port == 80)
              || ("https".equalsIgnoreCase(scheme) && port == 443);
      authority = defaultPort ? host : host + ":" + port;
    }
    return scheme + "://" + authority;
  }

  private static String firstNonBlank(String a, String b) {
    return Optional.ofNullable(a).filter(StringUtils::hasText).orElse(b);
  }

  private static String stripTrailingSlash(String s) {
    if (s.endsWith("/")) {
      return s.substring(0, s.length() - 1);
    }
    return s;
  }
}
