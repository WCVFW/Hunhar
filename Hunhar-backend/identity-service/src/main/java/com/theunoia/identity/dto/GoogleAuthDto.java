package com.theunoia.identity.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GoogleAuthDto {

    /** An ID token (JWT) from Google Identity Services. Send this or {@code accessToken}. */
    @Size(max = 4096)
    private String credential;

    /** An OAuth access token from the Google popup (token client), requested with the "openid email profile" scopes. */
    @Size(max = 4096)
    private String accessToken;

    /** Only needed the first time, when the Google email has no Hunhar account yet. */
    @Pattern(regexp = "^(FREELANCER|CLIENT)?$", message = "Role must be FREELANCER or CLIENT")
    private String role;

    @Size(max = 150, message = "Company name is too long")
    private String companyName;
}
