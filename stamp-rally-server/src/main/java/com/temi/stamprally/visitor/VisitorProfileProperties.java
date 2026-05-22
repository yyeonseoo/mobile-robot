package com.temi.stamprally.visitor;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.visitor")
public class VisitorProfileProperties {

  /** 비우면 시스템 임시 폴더 아래 visitor-photos 사용 */
  private String storageDir = "";

  public String getStorageDir() {
    return storageDir;
  }

  public void setStorageDir(String storageDir) {
    this.storageDir = storageDir;
  }
}
