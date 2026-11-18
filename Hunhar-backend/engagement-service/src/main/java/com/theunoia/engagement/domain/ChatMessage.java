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
}
