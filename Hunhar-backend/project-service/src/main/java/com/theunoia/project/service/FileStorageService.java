package com.theunoia.project.service;

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
import java.util.Locale;
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

        return storedFileRepository.save(StoredFile.builder()
                .ownerId(ownerId)
                .projectId(projectId)
                .originalName(originalName)
                .contentType(contentTypeFor(ext, file.getContentType()))
                .sizeBytes(file.getSize())
                .storagePath(relative)
                .build());
    }

    public StoredFile getMetadata(UUID id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    public Resource load(StoredFile file) {
        Path path = root().resolve(file.getStoragePath()).normalize();
        if (!path.startsWith(root()) || !Files.exists(path)) {
            throw new ResourceNotFoundException("File not found");
        }
        return new FileSystemResource(path);
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
