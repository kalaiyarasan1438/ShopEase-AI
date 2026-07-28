package com.shopeasy.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String useH2 = System.getenv("USE_H2");
        if (useH2 == null && (System.getenv("DATABASE_URL") == null || System.getenv("DATABASE_URL").isEmpty())) {
            useH2 = "true";
        }
        HikariDataSource dataSource = new HikariDataSource();

        if ("true".equalsIgnoreCase(useH2) || "true ".equalsIgnoreCase(useH2)) {
            dataSource.setJdbcUrl("jdbc:h2:mem:shopeasy;DB_CLOSE_DELAY=-1;MODE=PostgreSQL");
            dataSource.setUsername("sa");
            dataSource.setPassword("");
            dataSource.setDriverClassName("org.h2.Driver");
            dataSource.setMaximumPoolSize(10);
            dataSource.setMinimumIdle(5);
            dataSource.setConnectionTimeout(30000);
            return dataSource;
        }

        String dbUrlEnv = System.getenv("DATABASE_URL");

        if (dbUrlEnv != null && !dbUrlEnv.isEmpty()) {
            try {
                if (dbUrlEnv.startsWith("jdbc:")) {
                    dataSource.setJdbcUrl(dbUrlEnv);
                } else {
                    // Standard postgres:// or postgresql:// URL from Render/Railway/Neon
                    URI dbUri = new URI(dbUrlEnv);
                    String[] userInfo = dbUri.getUserInfo().split(":");
                    String username = userInfo[0];
                    String password = userInfo.length > 1 ? userInfo[1] : "";
                    
                    String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ":" + 
                                   (dbUri.getPort() == -1 ? 5432 : dbUri.getPort()) + 
                                   dbUri.getPath();

                    // SSL connection is usually required for serverless Neon PostgreSQL
                    if (!dbUrl.contains("sslmode")) {
                        if (dbUrl.contains("?")) {
                            dbUrl += "&sslmode=require";
                        } else {
                            dbUrl += "?sslmode=require";
                        }
                    }

                    dataSource.setJdbcUrl(dbUrl);
                    dataSource.setUsername(username);
                    dataSource.setPassword(password);
                }
            } catch (URISyntaxException e) {
                throw new RuntimeException("Failed to parse DATABASE_URL environment variable: " + dbUrlEnv, e);
            }
        } else {
            // Fallback to application properties / discrete env variables
            String dbHost = System.getenv("DB_HOST") != null ? System.getenv("DB_HOST") : "localhost";
            String dbPort = System.getenv("DB_PORT") != null ? System.getenv("DB_PORT") : "5432";
            String dbName = System.getenv("DB_NAME") != null ? System.getenv("DB_NAME") : "shopeasy";
            String dbUser = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "postgres";
            String dbPass = System.getenv("DB_PASS") != null ? System.getenv("DB_PASS") : "password";

            String dbUrl = "jdbc:postgresql://" + dbHost + ":" + dbPort + "/" + dbName;
            dataSource.setJdbcUrl(dbUrl);
            dataSource.setUsername(dbUser);
            dataSource.setPassword(dbPass);
        }

        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(5);
        dataSource.setConnectionTimeout(30000);

        return dataSource;
    }
}
