package com.theunoia.project.web;

import com.theunoia.common.dto.ApiResponse;
import com.theunoia.common.security.AuthUser;
import com.theunoia.common.security.CurrentUser;
import com.theunoia.project.domain.StoredFile;
import com.theunoia.project.service.FileStorageService;
import com.theunoia.project.service.ProjectAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static com.theunoia.project.service.ProjectAccessService.requireUser;

@RestController
@RequestMapping("/api/v1/projects/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final ProjectAccessService access;

    /**
     * Upload a file (max 20 MB). Pass {@code projectId} to attach it to a project workspace;
     * only project participants can do that.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<StoredFile>> upload(
            @CurrentUser AuthUser currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) UUID projectId
    ) {
        AuthUser user = requireUser(currentUser);
        if (projectId != null) {
            access.requireParticipant(projectId, user);
        }
        return ResponseEntity.ok(ApiResponse.ok("File uploaded", fileStorageService.store(file, user.id(), projectId)));
    }

    /** Files are addressed by unguessable UUID so they can be used in img tags without a token. */
    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean download) {
        StoredFile meta = fileStorageService.getMetadata(id);
        boolean inline = !download && (meta.getContentType().startsWith("image/") && !meta.getContentType().contains("svg")
                || meta.getContentType().equals("application/pdf"));
        ContentDisposition disposition = (inline ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(meta.getOriginalName(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.getContentType()))
                .contentLength(meta.getSizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
                .body(fileStorageService.load(meta));
    }
}
