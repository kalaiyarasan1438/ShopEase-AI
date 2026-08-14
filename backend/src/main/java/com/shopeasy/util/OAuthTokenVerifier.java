package com.shopeasy.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Verifies OAuth identity tokens from Google.
 *
 * <p><b>Mock mode:</b> tokens prefixed with {@code mock-google-token-} are decoded locally —
 * allowing full end-to-end testing in sandbox / local environments where real OAuth client IDs
 * are not configured.</p>
 *
 * <p>The mock payload is a Base64-encoded JSON string appended after the prefix:</p>
 * <pre>
 *   mock-google-token-eyJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwiZ2l2ZW5fbmFtZSI6IlRlc3QiLCJmYW1pbHlfbmFtZSI6IlVzZXIifQ==
 * </pre>
 */
import org.springframework.beans.factory.annotation.Value;

@Slf4j
@Component
public class OAuthTokenVerifier {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${google.client-id:}")
    private String googleClientId;

    // ── Public record returned by both verify methods ─────────────────────────

    public record OAuthUserInfo(String email, String firstName, String lastName, String avatarUrl) {}

    // ── Google ─────────────────────────────────────────────────────────────────

    /**
     * Verifies a Google ID token and returns user info.
     *
     * @throws IllegalArgumentException if the token is invalid or verification fails.
     */
    public OAuthUserInfo verifyGoogleToken(String idToken) {
        if (idToken != null && idToken.startsWith("mock-google-token-")) {
            return decodeMockPayload(idToken.substring("mock-google-token-".length()));
        }

        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = restTemplate.getForObject(url, Map.class);

            if (claims == null || claims.containsKey("error")) {
                throw new IllegalArgumentException("Google token verification failed");
            }

            String email     = (String) claims.get("email");
            String firstName = (String) claims.getOrDefault("given_name", "");
            String lastName  = (String) claims.getOrDefault("family_name", "");
            String avatar    = (String) claims.getOrDefault("picture", null);
            String aud       = (String) claims.get("aud");

            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google token did not contain a valid email");
            }

            if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals(aud)) {
                log.warn("Google token audience mismatch! Expected {}, got {}", googleClientId, aud);
                throw new IllegalArgumentException("Google token audience mismatch");
            }

            log.debug("Google token verified for: {}", email);
            return new OAuthUserInfo(email, firstName, lastName, avatar);

        } catch (Exception e) {
            log.warn("Google token verification error: {}", e.getMessage());
            throw new IllegalArgumentException("Google Sign-In failed: " + e.getMessage());
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Decodes a Base64-encoded JSON mock payload into an {@link OAuthUserInfo}.
     *
     * <p>Expected JSON fields: {@code email}, {@code given_name} (or {@code firstName}),
     * {@code family_name} (or {@code lastName}), {@code picture} (optional).</p>
     */
    private OAuthUserInfo decodeMockPayload(String base64Payload) {
        try {
            String json = new String(Base64.getDecoder().decode(base64Payload), StandardCharsets.UTF_8);
            String email     = extractJsonField(json, "email");
            String firstName = extractJsonField(json, "given_name");
            if (firstName == null) firstName = extractJsonField(json, "firstName");
            String lastName  = extractJsonField(json, "family_name");
            if (lastName == null) lastName = extractJsonField(json, "lastName");
            String avatar    = extractJsonField(json, "picture");

            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Mock OAuth payload missing email field");
            }
            return new OAuthUserInfo(email, firstName != null ? firstName : "Test", lastName != null ? lastName : "User", avatar);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid mock OAuth token: " + e.getMessage());
        }
    }

    /** Very simple JSON field extractor (no external library required). */
    private static String extractJsonField(String json, String fieldName) {
        String key = "\"" + fieldName + "\"";
        int idx = json.indexOf(key);
        if (idx == -1) return null;
        int colon = json.indexOf(':', idx + key.length());
        if (colon == -1) return null;
        // Skip whitespace and opening quote
        int start = colon + 1;
        while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == '\t')) start++;
        if (start >= json.length()) return null;
        if (json.charAt(start) == '"') {
            start++; // skip opening quote
            int end = json.indexOf('"', start);
            if (end == -1) return null;
            return json.substring(start, end);
        }
        if (json.charAt(start) == 'n') return null; // null value
        // numeric / boolean
        int end = start;
        while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
        return json.substring(start, end).trim();
    }

    /** Adds padding to Base64 strings that may be missing {@code =} characters. */
    private static String padBase64(String s) {
        int pad = 4 - s.length() % 4;
        if (pad < 4) s += "=".repeat(pad);
        return s;
    }
}
