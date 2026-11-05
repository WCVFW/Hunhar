package com.theunoia.gateway.crypto;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/** AES-256-GCM with a random 96-bit IV. Wire format: base64url(iv || ciphertext || tag). */
public final class AesGcm {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int IV_LEN = 12;
    private static final int TAG_BITS = 128;

    private AesGcm() {}

    public static String encrypt(SecretKey key, byte[] plaintext, String aad) throws GeneralSecurityException {
        byte[] iv = new byte[IV_LEN];
        RANDOM.nextBytes(iv);
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
        c.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
        byte[] ct = c.doFinal(plaintext);
        byte[] out = new byte[IV_LEN + ct.length];
        System.arraycopy(iv, 0, out, 0, IV_LEN);
        System.arraycopy(ct, 0, out, IV_LEN, ct.length);
        return ApiCryptoKeys.b64(out);
    }

    /** Throws (AEADBadTagException) when the data was tampered with, or the key or AAD do not match. */
    public static byte[] decrypt(SecretKey key, String payload, String aad) throws GeneralSecurityException {
        byte[] in;
        try {
            in = Base64.getUrlDecoder().decode(payload);
        } catch (IllegalArgumentException e) {
            throw new GeneralSecurityException("Payload is not base64url");
        }
        if (in.length < IV_LEN + TAG_BITS / 8) throw new GeneralSecurityException("Payload too short");
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, Arrays.copyOf(in, IV_LEN)));
        c.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
        return c.doFinal(in, IV_LEN, in.length - IV_LEN);
    }
}
