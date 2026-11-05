package com.theunoia.project.service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.core.io.InputStreamResource;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ServerSideEncryption;
import com.theunoia.common.exception.BadRequestException;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.project.domain.StoredFile;
import com.theunoia.project.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final long MAX_SIZE_BYTES = 20L * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "png", "jpg", "jpeg", "gif", "webp", "svg",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md",
            "zip", "rar", "7z",
            "fig", "psd", "ai", "sketch", "xd",
            "mp4", "mov", "webm", "mp3", "wav"
    );

    private final StoredFileRepository storedFileRepository;

    @Value("${theunoia.uploads.dir:./uploads}")
    private String uploadsDir;

    @Value("${theunoia.storage.type:local}")
    private String storageType;

    @Value("${theunoia.storage.s3.bucket:}")
    private String bucket;

    @Value("${theunoia.storage.s3.region:ap-south-1}")
    private String region;

    @Value("${theunoia.storage.s3.access-key:}")
    private String accessKey;

    @Value("${theunoia.storage.s3.secret-key:}")
    private String secretKey;

    private S3Client s3;

    @PostConstruct
    void init() {
        if (!"s3".equalsIgnoreCase(storageType)) {
            log.info("File storage: local disk ({})", root());
            return;
        }
        if (bucket.isBlank()) {
            throw new IllegalStateException("STORAGE_TYPE=s3 needs S3_BUCKET");
        }
        // Explicit keys from .env, otherwise the default chain (env vars, ~/.aws, EC2/ECS IAM role)
        AwsCredentialsProvider credentials = accessKey.isBlank()
                ? DefaultCredentialsProvider.create()
                : StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentials)
                .httpClientBuilder(ApacheHttpClient.builder())
                .build();
        log.info("File storage: Amazon S3 bucket {} ({})", bucket, region);
        String problem = checkS3();
        if (problem != null) {
            // Keep running (health shows DOWN) so the reason is visible instead of a restart loop
            log.error("S3 bucket {} is not usable: {}. Uploads will fail until this is fixed.", bucket, problem);
        }
    }

    /** null when the bucket answers; otherwise a short reason (bad name, no permission, no IAM role...). */
    private String checkS3() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            return null;
        } catch (S3Exception e) {
            int status = e.statusCode();
            if (status == 404) return "bucket does not exist";
            if (status == 403) return "access denied (IAM role/policy needs s3:ListBucket, GetObject, PutObject, DeleteObject)";
            if (status == 301) return "bucket is in another region than " + region;
            return e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage();
        } catch (SdkException e) {
            String msg = String.valueOf(e.getMessage());
            if (msg.contains("Unable to load credentials")) {
                return "no AWS credentials: attach the hunhar-ec2 IAM role to this EC2 instance (or set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY)";
            }
            return msg.length() > 300 ? msg.substring(0, 300) : msg;
        }
    }

    private volatile long healthCheckedAt;
    private volatile Map<String, Object> healthDetails;

    /** For /actuator/health: where files go and whether that place works. Checked at most every 30 s. */
    public Map<String, Object> health() {
        long now = System.currentTimeMillis();
        if (healthDetails != null && now - healthCheckedAt < 30_000) return healthDetails;
        Map<String, Object> d = new LinkedHashMap<>();
        if (s3 != null) {
            String problem = checkS3();
            d.put("type", "s3");
            d.put("bucket", bucket);
            d.put("region", region);
            d.put("ok", problem == null);
            if (problem != null) d.put("error", problem);
        } else {
            Path dir = root();
            boolean ok;
            try {
                Files.createDirectories(dir);
                ok = Files.isWritable(dir);
            } catch (IOException e) {
                ok = false;
            }
            d.put("type", "local");
            d.put("dir", dir.toString());
            d.put("ok", ok);
            if (!ok) d.put("error", "uploads folder is not writable");
        }
        healthDetails = d;
        healthCheckedAt = now;
        return d;
    }

    @PreDestroy
    void close() {
        if (s3 != null) s3.close();
    }

    public StoredFile store(MultipartFile file, UUID ownerId, UUID projectId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please choose a file to upload");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BadRequestException("File is too large. Maximum size is 20 MB");
        }
        String originalName = sanitizeName(file.getOriginalFilename());
        String ext = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("File type ." + ext + " is not allowed");
        }

        UUID storageId = UUID.randomUUID();
        String relative = LocalDate.now() + "/" + storageId + "." + ext;
        String contentType = contentTypeFor(ext, file.getContentType());
        String storage;
        if (s3 != null) {
            try (InputStream in = file.getInputStream()) {
                s3.putObject(PutObjectRequest.builder()
                                .bucket(bucket)
                                .key(s3Key(relative))
                                .contentType(contentType)
                                .serverSideEncryption(ServerSideEncryption.AES256)
                                .build(),
                        RequestBody.fromInputStream(in, file.getSize()));
            } catch (IOException | SdkException e) {
                log.error("Failed to upload {} to S3: {}", originalName, e.getMessage());
                throw new BadRequestException("Could not save the file. Please try again.");
            }
            storage = "S3";
        } else {
            Path target = root().resolve(relative).normalize();
            if (!target.startsWith(root())) {
                throw new BadRequestException("Invalid file path");
            }
            try (InputStream in = file.getInputStream()) {
                Files.createDirectories(target.getParent());
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                log.error("Failed to store upload {}: {}", originalName, e.getMessage());
                throw new BadRequestException("Could not save the file. Please try again.");
            }
            storage = "LOCAL";
        }

        return storedFileRepository.save(StoredFile.builder()
                .ownerId(ownerId)
                .projectId(projectId)
                .originalName(originalName)
                .contentType(contentType)
                .sizeBytes(file.getSize())
                .storagePath(relative)
                .storage(storage)
                .build());
    }

    public StoredFile getMetadata(UUID id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    public Resource load(StoredFile file) {
        if ("S3".equals(file.getStorage())) {
            if (s3 == null) {
                log.error("File {} is in S3 but STORAGE_TYPE is not s3", file.getId());
                throw new ResourceNotFoundException("File not found");
            }
            try {
                ResponseInputStream<GetObjectResponse> in = s3.getObject(GetObjectRequest.builder()
                        .bucket(bucket).key(s3Key(file.getStoragePath())).build());
                return new InputStreamResource(in);
            } catch (NoSuchKeyException e) {
                throw new ResourceNotFoundException("File not found");
            } catch (SdkException e) {
                log.error("Failed to read {} from S3: {}", file.getId(), e.getMessage());
                throw new ResourceNotFoundException("File is temporarily unavailable");
            }
        }
        Path path = root().resolve(file.getStoragePath()).normalize();
        if (!path.startsWith(root()) || !Files.exists(path)) {
            throw new ResourceNotFoundException("File not found");
        }
        return new FileSystemResource(path);
    }

    private static String s3Key(String relative) {
        return "uploads/" + relative;
    }

    private Path root() {
        return Paths.get(uploadsDir).toAbsolutePath().normalize();
    }

    private static String sanitizeName(String name) {
        String n = name == null ? "file" : Paths.get(name).getFileName().toString();
        n = n.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_").trim();
        if (n.isEmpty()) n = "file";
        return n.length() > 200 ? n.substring(n.length() - 200) : n;
    }

    private static String extensionOf(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String contentTypeFor(String ext, String declared) {
        return switch (ext) {
            case "png" -> "image/png";
            case "jpg", "jpeg" -> "image/jpeg";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "svg" -> "image/svg+xml";
            case "pdf" -> "application/pdf";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "mp3" -> "audio/mpeg";
            default -> "application/octet-stream";
        };
    }
}
