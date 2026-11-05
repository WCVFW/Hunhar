package com.theunoia.gateway.controller;

import com.theunoia.gateway.crypto.ApiCryptoKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Public: the gateway's ECDH public key the browser uses to set up payload encryption. */
@RestController
@RequiredArgsConstructor
public class CryptoController {

    private final ApiCryptoKeys keys;

    @GetMapping("/api/v1/crypto/public-key")
    public Map<String, Object> publicKey() {
        return Map.of(
                "success", true,
                "data", Map.of(
                        "keyId", keys.keyId(),
                        "publicKey", keys.publicKeyBase64Url(),
                        "algorithm", "ECDH-P256 + SHA-256 + AES-256-GCM"));
    }
}
