package com.apihour.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupLogger implements ApplicationRunner {

  private static final Logger logger = LoggerFactory.getLogger(StartupLogger.class);

  @Value("${server.port:8080}")
  private String serverPort;

  @Value("${spring.application.name}")
  private String applicationName;

  @Override
  public void run(ApplicationArguments args) {
    logger.info("=".repeat(80));
    logger.info("{} - Serveur en ligne !", applicationName.toUpperCase());
    logger.info("Adresse locale : http://localhost:{}", serverPort);
    logger.info("Adresse réseau : http://127.0.0.1:{}", serverPort);
    logger.info("API Documentation : http://localhost:{}/api", serverPort);
    logger.info("=".repeat(80));
  }
}
