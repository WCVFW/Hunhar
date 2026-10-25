package com.theunoia.engagement.service;

import com.theunoia.common.dto.PagedResponse;
import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.engagement.domain.ForumComment;
import com.theunoia.engagement.domain.ForumPost;
import com.theunoia.engagement.repository.ForumCommentRepository;
import com.theunoia.engagement.repository.ForumPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForumService {

    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;

    @Transactional
    public ForumPost createPost(UUID authorId, String authorName, String title, String content, String topic) {
        ForumPost post = ForumPost.builder()
                .authorId(authorId)
                .authorName(authorName)
                .title(title)
                .content(content)
                .topic(topic != null ? topic : "Discussions")
                .upvotes(0)
                .isAnswered(false)
                .build();
        return forumPostRepository.save(post);
    }

    @Transactional
    public ForumComment addComment(UUID postId, UUID authorId, String authorName, String content) {
        forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Forum post not found"));

        ForumComment comment = ForumComment.builder()
                .postId(postId)
                .authorId(authorId)
                .authorName(authorName)
                .content(content)
                .isAcceptedAnswer(false)
                .build();
        return forumCommentRepository.save(comment);
    }

    @Transactional
    public void acceptAnswer(UUID commentId) {
        ForumComment comment = forumCommentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        comment.setAcceptedAnswer(true);
        forumCommentRepository.save(comment);

        ForumPost post = forumPostRepository.findById(comment.getPostId()).orElse(null);
        if (post != null) {
            post.setAnswered(true);
            forumPostRepository.save(post);
        }
    }

    @Transactional
    public ForumPost upvotePost(UUID postId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        post.setUpvotes(post.getUpvotes() + 1);
        return forumPostRepository.save(post);
    }

    public PagedResponse<ForumPost> getPosts(String topic, Pageable pageable) {
        Page<ForumPost> page;
        if (topic != null && !topic.isBlank()) {
            page = forumPostRepository.findByTopic(topic, pageable);
        } else {
            page = forumPostRepository.findAll(pageable);
        }
        return PagedResponse.<ForumPost>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public List<ForumComment> getComments(UUID postId) {
        return forumCommentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }
}
