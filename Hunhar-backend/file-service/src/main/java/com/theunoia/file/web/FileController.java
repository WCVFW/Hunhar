package com.theunoia.file.web;

import com.theunoia.common.security.CurrentUser;
import com.theunoia.file.domain.StoredFile;
import com.theunoia.file.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Cloud Storage Service: uploads go to S3/MinIO, downloads are short-lived presigned URLs (no proxying of bytes). */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService storage;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> upload(@RequestPart("file") MultipartFile file,
                                      @RequestParam(defaultValue = "OTHER") String purpose,
                                      @RequestParam(defaultValue = "PRIVATE") String visibility) {
        return storage.upload(CurrentUser.require(), file, purpose, visibility);
    }

    @GetMapping("/mine")
    public List<StoredFile> mine() {
        return storage.mine(CurrentUser.require());
    }

    @GetMapping("/{id}")
    public Map<String, Object> metadata(@PathVariable UUID id) {
        CurrentUser.require();
        return storage.metadata(id);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Void> download(@PathVariable UUID id) {
        CurrentUser.require();
        return redirect(storage.presignedDownload(id));
    }

    @GetMapping("/public/{id}/download")
    public ResponseEntity<Void> publicDownload(@PathVariable UUID id) {
        return redirect(storage.publicDownload(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        storage.delete(CurrentUser.require(), id);
    }

    private static ResponseEntity<Void> redirect(String url) {
        return ResponseEntity.status(HttpStatus.FOUND).header(HttpHeaders.LOCATION, url)
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=60").build();
    }
}
