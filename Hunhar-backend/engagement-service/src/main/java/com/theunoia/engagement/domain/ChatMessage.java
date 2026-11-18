package com.theunoia.engagement.domain;

import com.theunoia.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID conversationId;

    @Column(nullable = false)
    private UUID senderId;

    private String senderName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String attachmentUrl;

    /** Original file name, type and size of the attachment (shown in the chat). */
    @Column(length = 255)
    private String attachmentName;

    @Column(length = 120)
    private String attachmentType;

    private Long attachmentSize;

    /** Set when the sender edited the text. */
    private java.time.Instant editedAt;

    /** Set when the sender deleted the message; content and attachment are cleared. */
    private java.time.Instant deletedAt;

    /** The message this one replies to, with a short preview so the quote shows even if that message changes. */
    private UUID replyToId;

    @Column(length = 100)
    private String replyToSenderName;

    @Column(length = 200)
    private String replyToPreview;

    /** Emoji reactions as JSON: {"👍":["userId",...]} — exposed to the API as "reactions". */
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(columnDefinition = "TEXT")
    private String reactionsJson;

    private static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("reactions")
    public java.util.Map<String, java.util.List<String>> getReactions() {
        if (reactionsJson == null || reactionsJson.isBlank()) return new java.util.LinkedHashMap<>();
        try {
            return JSON.readValue(reactionsJson,
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.LinkedHashMap<String, java.util.List<String>>>() {});
        } catch (Exception e) {
            return new java.util.LinkedHashMap<>();
        }
    }

    public void setReactions(java.util.Map<String, java.util.List<String>> reactions) {
        try {
            this.reactionsJson = reactions == null || reactions.isEmpty() ? null : JSON.writeValueAsString(reactions);
        } catch (Exception e) {
            this.reactionsJson = null;
        }
    }
}
