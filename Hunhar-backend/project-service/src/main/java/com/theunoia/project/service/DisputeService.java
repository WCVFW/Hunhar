package com.theunoia.project.service;

import com.theunoia.common.exception.ResourceNotFoundException;
import com.theunoia.project.domain.Dispute;
import com.theunoia.project.dto.CreateDisputeDto;
import com.theunoia.project.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;

    @Transactional
    public Dispute raiseDispute(UUID projectId, UUID raisedById, CreateDisputeDto dto) {
        Dispute dispute = Dispute.builder()
                .projectId(projectId)
                .raisedById(raisedById)
                .reason(dto.getReason())
                .status("OPEN")
                .build();
        return disputeRepository.save(dispute);
    }

    public List<Dispute> getProjectDisputes(UUID projectId) {
        return disputeRepository.findByProjectId(projectId);
    }

    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    @Transactional
    public Dispute resolveDispute(UUID disputeId, String resolutionNotes, String status) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found"));
        dispute.setResolutionNotes(resolutionNotes);
        dispute.setStatus(status);
        return disputeRepository.save(dispute);
    }
}
