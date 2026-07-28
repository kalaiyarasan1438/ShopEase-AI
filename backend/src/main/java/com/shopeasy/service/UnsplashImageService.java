package com.shopeasy.service;

import com.shopeasy.util.ImageValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@Service
public class UnsplashImageService {
    private static final Logger log = LoggerFactory.getLogger(UnsplashImageService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    @Value("${unsplash.access-key:}")
    private String accessKey;

    private static final String SEARCH_URL = "https://api.unsplash.com/search/photos?query=%s&per_page=1&client_id=%s";

    public String fetchPhotoId(String query) {
        try {
            String url = String.format(SEARCH_URL, query.replace(" ", "+"), accessKey);
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                var results = (java.util.List<Map>) response.getBody().get("results");
                if (results != null && !results.isEmpty()) {
                    var first = results.get(0);
                    String id = (String) first.get("id");
                    // verify URL reachable
                    String testUrl = "https://images.unsplash.com/" + id + "?w=600&h=600&fit=crop&auto=format&q=80";
                    if (ImageValidator.urlExists(testUrl)) {
                        return id;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Unsplash fetch failed for '{}': {}", query, e.getMessage());
        }
        return null;
    }
}
