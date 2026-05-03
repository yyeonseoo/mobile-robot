package com.temi.stamprally.photobooth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.photo-booth")
public class PhotoBoothProperties {

  /**
   * Absolute site origin for QR and deep links, e.g. {@code https://fest.example.com}. When
   * blank, the server builds the URL from the incoming HTTP request (Host / forwarded headers).
   */
  private String publicBaseUrl = "";

  /** Root directory for uploaded booth photos. Empty uses the JVM temp directory. */
  private String storageDir = "";

  public String getPublicBaseUrl() {
    return publicBaseUrl;
  }

  public void setPublicBaseUrl(String publicBaseUrl) {
    this.publicBaseUrl = publicBaseUrl;
  }

  public String getStorageDir() {
    return storageDir;
  }

  public void setStorageDir(String storageDir) {
    this.storageDir = storageDir;
  }
}
