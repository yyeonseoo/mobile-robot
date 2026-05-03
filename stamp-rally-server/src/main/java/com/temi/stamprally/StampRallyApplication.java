package com.temi.stamprally;

import com.temi.stamprally.photobooth.PhotoBoothProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(PhotoBoothProperties.class)
public class StampRallyApplication {

  public static void main(String[] args) {
    SpringApplication.run(StampRallyApplication.class, args);
  }
}
