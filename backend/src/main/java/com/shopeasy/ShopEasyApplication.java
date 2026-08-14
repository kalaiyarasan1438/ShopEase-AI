package com.shopeasy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.File;
import java.util.Scanner;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class ShopEasyApplication {
    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(ShopEasyApplication.class, args);
    }

    private static void loadDotEnv() {
        File[] candidates = { new File(".env"), new File("backend/.env") };
        for (File envFile : candidates) {
            if (envFile.exists()) {
                try (Scanner scanner = new Scanner(envFile)) {
                    while (scanner.hasNextLine()) {
                        String line = scanner.nextLine().trim();
                        if (!line.startsWith("#") && line.contains("=")) {
                            String[] parts = line.split("=", 2);
                            String key = parts[0].trim();
                            String val = parts[1].trim();
                            if (!key.isEmpty() && System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
    }
}
