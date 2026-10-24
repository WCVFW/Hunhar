package com.theunoia.file;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "theunoia.events.relay-interval-ms=3600000",
        "theunoia.storage.create-bucket=false"
})
@AutoConfigureMockMvc
class FileServiceIntegrationTest {

    private static final EmbeddedPostgres PG;

    static {
        try {
            PG = EmbeddedPostgres.builder().start();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> PG.getJdbcUrl("postgres", "postgres"));
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "postgres");
    }

    @AfterAll
    static void stop() throws IOException {
        PG.close();
    }

    @Autowired
    MockMvc mvc;
    @MockBean
    S3Client s3;

    @Test
    void uploadValidatesAndStoresInObjectStorage() throws Exception {
        String user = UUID.randomUUID().toString();
        MockMultipartFile pdf = new MockMultipartFile("file", "../../etc/My Brief.pdf", "application/pdf", "%PDF-1.4 test".getBytes());
        mvc.perform(multipart("/api/v1/files").file(pdf).param("purpose", "PROJECT_ATTACHMENT")
                        .header("X-Internal-Token", "dev-internal-token-change-me").header("X-User-Id", user)
                        .header("X-User-Role", "CLIENT").header("X-User-Status", "ACTIVE"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("My_Brief.pdf"))   // path traversal stripped
                .andExpect(jsonPath("$.visibility").value("PRIVATE"));
        verify(s3).putObject(any(PutObjectRequest.class), any(RequestBody.class));

        MockMultipartFile exe = new MockMultipartFile("file", "virus.exe", "application/x-msdownload", new byte[]{1, 2, 3});
        mvc.perform(multipart("/api/v1/files").file(exe)
                        .header("X-Internal-Token", "dev-internal-token-change-me").header("X-User-Id", user)
                        .header("X-User-Role", "CLIENT").header("X-User-Status", "ACTIVE"))
                .andExpect(status().isUnsupportedMediaType());
    }
}
