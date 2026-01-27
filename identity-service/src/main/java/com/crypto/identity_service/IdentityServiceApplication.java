package com.crypto.identity_service;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class IdentityServiceApplication {

  public static void main(String[] args) {
    // Load .env file and set as system properties
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    dotenv
        .entries()
        .forEach(
            entry -> {
              if (System.getProperty(entry.getKey()) == null) {
                System.setProperty(entry.getKey(), entry.getValue());
              }
            });

    SpringApplication.run(IdentityServiceApplication.class, args);
  }
}
