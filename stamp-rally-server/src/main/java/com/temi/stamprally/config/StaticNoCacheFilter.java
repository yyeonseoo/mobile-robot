package com.temi.stamprally.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 테미/모바일 WebView·브라우저가 CSS·HTML을 오래 붙잡는 것을 줄이기 위해 개발용으로 캐시를 끕니다.
 */
@Component
public class StaticNoCacheFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String path = request.getRequestURI();
    if (path.startsWith("/temi/")
        || path.startsWith("/asset/")
        || path.startsWith("/mobile/")) {
      response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      response.setHeader("Pragma", "no-cache");
    }
    filterChain.doFilter(request, response);
  }
}
