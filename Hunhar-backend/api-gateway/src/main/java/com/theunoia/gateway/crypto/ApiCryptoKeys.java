package com.theunoia.gateway.crypto;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.*;
import java.security.interfaces.ECPublicKey;
import java.security.spec.*;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

/**
 * The gateway's long-lived ECDH P-256 key pair for payload encryption.
 *
 * Each browser tab generates its own ephemeral key pair, sends its public key with every request
 * (X-Enc-Key), and both sides derive the same AES-256 key: SHA-256(ECDH shared secret).
 *
 * The key pair comes from API_ENC_KEY_PAIR ("&lt;pkcs8-base64&gt;.&lt;x509-base64&gt;", set the same value on every
 * gateway instance), otherwise from the key file, which is created on first start.
 */
@Slf4j
@Component
public class ApiCryptoKeys {

    private static final int MAX_CACHED_KEYS = 20_000;

    private final KeyPair keyPair;
    private final byte[] publicKeyRaw;
    private final String keyId;
    private final Map<String, SecretKey> derivedKeys = Collections.synchronizedMap(new LinkedHashMap<>(256, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, SecretKey> eldest) {
            return size() > MAX_CACHED_KEYS;
        }
    });

    public ApiCryptoKeys(@Value("${theunoia.gateway.encryption.key-pair:}") String keyPairValue,
                         @Value("${theunoia.gateway.encryption.key-file:.api-enc-key}") String keyFile) throws Exception {
        this.keyPair = load(keyPairValue, Path.of(keyFile));
        ECPublicKey pub = (ECPublicKey) keyPair.getPublic();
        this.publicKeyRaw = new byte[65];
        publicKeyRaw[0] = 0x04;
        copyFixed(pub.getW().getAffineX(), publicKeyRaw, 1);
        copyFixed(pub.getW().getAffineY(), publicKeyRaw, 33);
        this.keyId = b64(Arrays.copyOf(MessageDigest.getInstance("SHA-256").digest(publicKeyRaw), 9));
    }

    public String keyId() {
        return keyId;
    }

    public String publicKeyBase64Url() {
        return b64(publicKeyRaw);
    }

    /** AES-256 key shared with the browser whose raw (uncompressed, 65-byte) P-256 public key is given. */
    public SecretKey deriveKey(String clientPublicKeyB64) throws GeneralSecurityException {
        SecretKey cached = derivedKeys.get(clientPublicKeyB64);
        if (cached != null) return cached;

        byte[] raw = Base64.getUrlDecoder().decode(clientPublicKeyB64);
        if (raw.length != 65 || raw[0] != 0x04) throw new InvalidKeyException("Client key must be an uncompressed P-256 point");
        ECPoint point = new ECPoint(new BigInteger(1, Arrays.copyOfRange(raw, 1, 33)), new BigInteger(1, Arrays.copyOfRange(raw, 33, 65)));
        ECParameterSpec params = ((ECPublicKey) keyPair.getPublic()).getParams();
        PublicKey clientKey = KeyFactory.getInstance("EC").generatePublic(new ECPublicKeySpec(point, params));

        // SunEC validates that the point is on the curve (protects against invalid-curve attacks)
        KeyAgreement ka = KeyAgreement.getInstance("ECDH");
        ka.init(keyPair.getPrivate());
        ka.doPhase(clientKey, true);
        byte[] shared = ka.generateSecret();
        SecretKey key = new SecretKeySpec(MessageDigest.getInstance("SHA-256").digest(shared), "AES");
        Arrays.fill(shared, (byte) 0);
        derivedKeys.put(clientPublicKeyB64, key);
        return key;
    }

    private static KeyPair load(String value, Path file) throws Exception {
        KeyFactory kf = KeyFactory.getInstance("EC");
        String stored = value != null && !value.isBlank() ? value.trim() : null;
        if (stored == null && Files.exists(file)) {
            stored = Files.readString(file, StandardCharsets.UTF_8).trim();
        }
        if (stored != null) {
            String[] parts = stored.split("\\.");
            if (parts.length != 2) throw new IllegalStateException("Invalid API encryption key pair format");
            PrivateKey priv = kf.generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(parts[0])));
            PublicKey pub = kf.generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(parts[1])));
            log.info("API payload encryption key loaded ({})", value != null && !value.isBlank() ? "API_ENC_KEY_PAIR" : file.toAbsolutePath());
            return new KeyPair(pub, priv);
        }

        KeyPairGenerator gen = KeyPairGenerator.getInstance("EC");
        gen.initialize(new ECGenParameterSpec("secp256r1"), SecureRandom.getInstanceStrong());
        KeyPair kp = gen.generateKeyPair();
        String encoded = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded()) + "."
                + Base64.getEncoder().encodeToString(kp.getPublic().getEncoded());
        Files.writeString(file, encoded, StandardCharsets.UTF_8);
        log.warn("Generated a new API payload encryption key at {}. For several gateway instances, set API_ENC_KEY_PAIR to its contents.",
                file.toAbsolutePath());
        return kp;
    }

    private static void copyFixed(BigInteger v, byte[] out, int offset) {
        byte[] b = v.toByteArray();
        int len = Math.min(b.length, 32);
        System.arraycopy(b, b.length - len, out, offset + 32 - len, len);
    }

    static String b64(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
