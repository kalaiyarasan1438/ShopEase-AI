package com.shopeasy.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${server.port:8080}")
    private String port;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("ShopEasy API")
                .description("""
                    ## ShopEasy — Premium Multi-Vendor E-Commerce API
                    
                    Full REST API for the ShopEasy platform.
                    
                    ### Authentication
                    Use **POST /api/auth/login** to obtain a JWT access token,
                    then click **Authorize** and enter: `Bearer <token>`
                    """)
                .version("v1.0.0")
                .contact(new Contact()
                    .name("ShopEasy Team")
                    .email("api@shopeasy.com"))
                .license(new License().name("MIT")))
            .servers(List.of(
                new Server().url("http://localhost:" + port).description("Local development"),
                new Server().url("https://shopeasy-api.onrender.com").description("Production")
            ))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .name("bearerAuth")
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Enter JWT token obtained from /api/auth/login")));
    }
}
