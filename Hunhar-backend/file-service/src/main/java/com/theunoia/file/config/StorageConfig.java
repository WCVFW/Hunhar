package com.theunoia.file.config;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;
import java.time.Duration;
import java.util.List;

@Slf4j
@Configuration
public class StorageConfig {

    @Getter
    @Setter
    @ConfigurationProperties(prefix = "theunoia.storage")
    public static class StorageProperties {
        /** Empty = AWS S3; set to http://minio:9000 for MinIO. */
        private String endpoint;
        /** Public endpoint used in presigned URLs (browser-reachable), defaults to endpoint. */
        private String publicEndpoint;
        private String region = "ap-south-1";
        private String bucket = "theunoia-files";
        private String accessKey;
        private String secretKey;
        private boolean createBucket = false;
        private long maxFileBytes = 25L * 1024 * 1024;
        private long userQuotaBytes = 1024L * 1024 * 1024;
        private Duration presignTtl = Duration.ofMinutes(15);
        private List<String> allowedContentTypes = List.of(
                "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "text/csv",
                "application/zip", "application/x-zip-compressed",
                "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    }

    @Bean
    public S3Client s3Client(StorageProperties p) {
        var builder = S3Client.builder()
                .region(Region.of(p.getRegion()))
                .credentialsProvider(credentials(p))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(p.getEndpoint() != null && !p.getEndpoint().isBlank()).build());
        if (p.getEndpoint() != null && !p.getEndpoint().isBlank()) builder.endpointOverride(URI.create(p.getEndpoint()));
        return builder.build();
    }

    @Bean
    public S3Presigner s3Presigner(StorageProperties p) {
        var builder = S3Presigner.builder()
                .region(Region.of(p.getRegion()))
                .credentialsProvider(credentials(p))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(p.getEndpoint() != null && !p.getEndpoint().isBlank()).build());
        String endpoint = p.getPublicEndpoint() != null && !p.getPublicEndpoint().isBlank() ? p.getPublicEndpoint() : p.getEndpoint();
        if (endpoint != null && !endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
        return builder.build();
    }

    /** Local/dev convenience: create the bucket at startup (MinIO). Production buckets come from IaC. */
    @Bean
    public ApplicationRunner ensureBucket(S3Client s3, StorageProperties p) {
        return args -> {
            if (!p.isCreateBucket()) return;
            try {
                s3.headBucket(HeadBucketRequest.builder().bucket(p.getBucket()).build());
            } catch (Exception notFound) {
                try {
                    s3.createBucket(b -> b.bucket(p.getBucket()));
                    log.info("Created bucket {}", p.getBucket());
                } catch (Exception e) {
                    log.warn("Could not create bucket {}: {}", p.getBucket(), e.getMessage());
                }
            }
        };
    }

    private static AwsCredentialsProvider credentials(StorageProperties p) {
        if (p.getAccessKey() != null && !p.getAccessKey().isBlank()) {
            return StaticCredentialsProvider.create(AwsBasicCredentials.create(p.getAccessKey(), p.getSecretKey()));
        }
        return DefaultCredentialsProvider.create(); // IRSA / instance profile in production
    }
}
