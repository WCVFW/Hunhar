package com.theunoia.project.repository;

import com.theunoia.project.domain.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {
    List<StoredFile> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
