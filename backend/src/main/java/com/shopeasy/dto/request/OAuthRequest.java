package com.shopeasy.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthRequest {

    @NotBlank(message = "idToken is required")
    private String idToken;

    /** Optional user name hints if available */
    private String firstName;
    private String lastName;
}
