package com.theunoia.file.service;

import com.theunoia.common.exception.ApiException;
import com.theunoia.common.security.AuthUser;
import com.theunoia.file.config.StorageConfig.StorageProperties;
import com.theunoia.file.domain.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.IOException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {
        List<StoredFile> findTop100ByOwnerIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID ownerId);
    }

    private static final Set<String> PURPOSES = Set.of("AVATAR", "PORTFOLIO", "PROJECT_ATTACHMENT", "DELIVERABLE",
            "MESSAGE_ATTACHMENT", "BLOG_IMAGE", "KYC_DOCUMENT", "OTHER");
    private static final DateTimeFormatter PREFIX = DateTimeFormatter.ofPattern("yyyy/MM").withZone(ZoneOffset.UTC);

    private final StoredFileRepository files;
    private final S3Client s3;
    private final S3Presigner presigner;
    private final StorageProperties props;
    private final JdbcTemplate jdbc;

    @Transactional
    public Map<String, Object> upload(AuthUser user, MultipartFile file, String purpose, String visibility) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("File is empty");
        String p = purpose == null ? "OTHER" : purpose.toUpperCase();
        if (!PURPOSES.contains(p)) throw ApiException.badRequest("Unknown purpose");
        if (file.getSize() > props.getMaxFileBytes()) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE", "Max file size is " + props.getMaxFileBytes() / (1024 * 1024) + " MB");
        }
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!props.getAllowedContentTypes().contains(contentType)) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_FILE_TYPE", "File type " + contentType + " is not allowed");
        }
        Long used = jdbc.queryForObject("SELECT user_storage_bytes(?)", Long.class, user.id());
        if (used != null && used + file.getSize() > props.getUserQuotaBytes()) {
            throw ApiException.unprocessable("STORAGE_QUOTA_EXCEEDED", "Storage quota exceeded");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read upload");
        }
        UUID id = UUID.randomUUID();
        String name = sanitize(file.getOriginalFilename());
        String key = p.toLowerCase() + "/" + PREFIX.format(Instant.now()) + "/" + id + "-" + name;
        String checksum = sha256(bytes);

        s3.putObject(PutObjectRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .contentType(contentType)
                .contentLength((long) bytes.length)
                .contentDisposition("attachment; filename=\"" + name + "\"")
                .metadata(Map.of("owner", user.id().toString(), "sha256", checksum))
                .build(), RequestBody.fromBytes(bytes));

        StoredFile f = new StoredFile();
        f.setOwnerId(user.id());
        f.setPurpose(p);
        f.setBucket(props.getBucket());
        f.setObjectKey(key);
        f.setOriginalName(name);
        f.setContentType(contentType);
        f.setSizeBytes(bytes.length);
        f.setChecksumSha256(checksum);
        f.setVisibility("PUBLIC".equalsIgnoreCase(visibility) || "AVATAR".equals(p) || "BLOG_IMAGE".equals(p) ? "PUBLIC" : "PRIVATE");
        files.save(f);
        return view(f);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> metadata(UUID id) {
        return view(load(id));
    }

    /**
     * PRIVATE files are "capability URLs": any authenticated user holding the unguessable file id
     * (shared inside a project, message or deliverable) may download; listing is owner-only.
     */
    @Transactional(readOnly = true)
    public String presignedDownload(UUID id) {
        StoredFile f = load(id);
        return presigner.presignGetObject(r -> r.signatureDuration(props.getPresignTtl())
                        .getObjectRequest(g -> g.bucket(f.getBucket()).key(f.getObjectKey())))
                .url().toString();
    }

    @Transactional(readOnly = true)
    public String publicDownload(UUID id) {
        StoredFile f = load(id);
        if (!"PUBLIC".equals(f.getVisibility())) throw ApiException.notFound("File");
        return presignedDownload(id);
    }

    @Transactional(readOnly = true)
    public List<StoredFile> mine(AuthUser user) {
        return files.findTop100ByOwnerIdAndDeletedAtIsNullOrderByCreatedAtDesc(user.id());
    }

    @Transactional
    public void delete(AuthUser user, UUID id) {
        StoredFile f = load(id);
        if (!f.getOwnerId().equals(user.id()) && !user.isAdmin()) throw ApiException.forbidden("Not your file");
        f.setDeletedAt(Instant.now());
        s3.deleteObject(b -> b.bucket(f.getBucket()).key(f.getObjectKey()));
    }

    private StoredFile load(UUID id) {
        return files.findById(id).filter(f -> f.getDeletedAt() == null).orElseThrow(() -> ApiException.notFound("File"));
    }

    private static Map<String, Object> view(StoredFile f) {
        String base = "PUBLIC".equals(f.getVisibility()) ? "/api/v1/files/public/" : "/api/v1/files/";
        return Map.of("id", f.getId(), "fileName", f.getOriginalName(), "contentType", f.getContentType(),
                "sizeBytes", f.getSizeBytes(), "purpose", f.getPurpose(), "visibility", f.getVisibility(),
                "checksumSha256", f.getChecksumSha256(), "url", base + f.getId() + "/download",
                "createdAt", f.getCreatedAt() == null ? Instant.now() : f.getCreatedAt());
    }

    static String sanitize(String original) {
        String name = original == null || original.isBlank() ? "file" : original;
        name = name.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);              // strip any path (path traversal)
        name = name.replaceAll("[^A-Za-z0-9._-]", "_");
        if (name.startsWith(".")) name = "_" + name;
        return name.length() > 120 ? name.substring(name.length() - 120) : name;
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
