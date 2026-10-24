package com.theunoia.auth.service;

import com.theunoia.auth.config.AuthProperties;
import com.theunoia.auth.domain.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues short-lived HS256 access tokens. The API gateway verifies them with the same
 * secret; services never see the token, only the identity headers derived from it.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final AuthProperties props;

    public JwtService(AuthProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.getJwtSecret()));
    }

    public String issueAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer("theunoia-auth")
                .subject(user.getId().toString())
                .claim("typ", "access")
                .claim("role", user.getRole().name())
                .claim("status", user.getStatus().name())
                .claim("email", user.getEmail())
                .claim("name", user.getDisplayName())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(props.getAccessTokenTtl())))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public long accessTokenTtlSeconds() {
        return props.getAccessTokenTtl().toSeconds();
    }
}
