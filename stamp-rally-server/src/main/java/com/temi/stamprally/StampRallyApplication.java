package com.temi.stamprally;

import com.temi.stamprally.ai.AnthropicProperties;
import com.temi.stamprally.photobooth.PhotoBoothProperties;
import com.temi.stamprally.visitor.VisitorProfileProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
  PhotoBoothProperties.class,
  AnthropicProperties.class,
  VisitorProfileProperties.class
})
public class StampRallyApplication {

  public static void main(String[] args) {
    SpringApplication.run(StampRallyApplication.class, args);
  }
}
