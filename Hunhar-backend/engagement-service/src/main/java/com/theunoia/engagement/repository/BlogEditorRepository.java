package com.theunoia.engagement.repository;

import com.theunoia.engagement.domain.BlogEditor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BlogEditorRepository extends JpaRepository<BlogEditor, UUID> {

    Optional<BlogEditor> findByEmailIgnoreCase(String email);
}
