package com.shopeasy.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.HttpURLConnection;
import java.net.URL;

public class ImageValidator {
    private static final Logger log = LoggerFactory.getLogger(ImageValidator.class);
    private static final int TIMEOUT_MS = 2000;

    /**
     * Performs a lightweight HTTP HEAD request to verify that the given URL is reachable (status 200).
     * Returns false if any exception occurs or the response code is not 200.
     */
    public static boolean urlExists(String urlStr) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);
            int responseCode = conn.getResponseCode();
            return responseCode == HttpURLConnection.HTTP_OK;
        } catch (Exception e) {
            log.warn("Failed to validate image URL {}: {}", urlStr, e.getMessage());
            return false;
        }
    }
}
