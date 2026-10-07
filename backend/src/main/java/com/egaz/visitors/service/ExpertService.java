package com.egaz.visitors.service;

import com.egaz.visitors.dto.ExpertRequest;
import com.egaz.visitors.dto.ExpertResponse;
import com.egaz.visitors.entity.Expert;
import com.egaz.visitors.exception.ConflictException;
import com.egaz.visitors.exception.ResourceNotFoundException;
import com.egaz.visitors.repository.ExpertRepository;
import com.egaz.visitors.repository.UserRepository;
import com.egaz.visitors.repository.VisitorRepository;
import java.util.List;
import java.util.HashSet;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExpertService {
    private final ExpertRepository repository;
    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;

    public ExpertService(ExpertRepository repository, VisitorRepository visitorRepository, UserRepository userRepository) {
        this.repository = repository;
        this.visitorRepository = visitorRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ExpertResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ExpertResponse findById(String id) { return toResponse(get(id)); }

    public ExpertResponse create(ExpertRequest request) {
        validate(request);
        Expert e = new Expert();
        e.setId(UUID.randomUUID().toString());
        e.setFullname(request.fullname().trim());
        e.setDepartment(clean(request.department()));
        applyAccount(e, request, true);
        return toResponse(repository.save(e));
    }

    public ExpertResponse update(String id, ExpertRequest request) {
        validate(request);
        Expert e = get(id);
        e.setFullname(request.fullname().trim());
        e.setDepartment(clean(request.department()));
        applyAccount(e, request, false);
        return toResponse(repository.save(e));
    }

    public void delete(String id) {
        Expert e = get(id);
        if (visitorRepository.countByExpert_Id(id) > 0) {
            throw new ConflictException("Cannot delete expert while visitors are assigned to this expert");
        }
        repository.delete(e);
    }

    private Expert get(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Expert not found: " + id));
    }

    private void validate(ExpertRequest r) {
        if (r == null || r.fullname() == null || r.fullname().trim().isEmpty())
            throw new IllegalArgumentException("fullname is required");
        if (r.username() != null && !r.username().isBlank()
                && (r.password() == null || r.password().isBlank())) {
            Expert existing = repository.findByUsername(r.username().trim()).orElse(null);
            if (existing == null || existing.getPassword() == null) {
                throw new IllegalArgumentException("password is required when setting an expert username");
            }
        }
    }

    private void applyAccount(Expert expert, ExpertRequest request, boolean creating) {
        String username = clean(request.username());
        if (username != null) {
            if (userRepository.existsByUsername(username)
                    || repository.findAll().stream().anyMatch(other -> !other.getId().equals(expert.getId())
                            && username.equals(other.getUsername()))) {
                throw new ConflictException("Username already exists: " + username);
            }
            expert.setUsername(username);
        }
        if (!blank(request.password())) expert.setPassword(request.password());
        if (request.permissions() != null) {
            expert.setPermissions(new HashSet<>(request.permissions()));
            expert.setCanDeleteVisitors(expert.getPermissions().contains("visitors.delete"));
        } else if (request.canDeleteVisitors() != null) {
            expert.setCanDeleteVisitors(request.canDeleteVisitors());
        }
        if (expert.isCanDeleteVisitors()) expert.getPermissions().add("visitors.delete");
        else if (request.canDeleteVisitors() != null || request.permissions() != null) {
            expert.getPermissions().remove("visitors.delete");
        }
        else if (creating) expert.setCanDeleteVisitors(false);
    }

    private boolean blank(String value) { return value == null || value.trim().isEmpty(); }
    private String clean(String value) { return value == null || value.trim().isEmpty() ? null : value.trim(); }
    private ExpertResponse toResponse(Expert e) {
        return new ExpertResponse(e.getId(), e.getFullname(), e.getDepartment(), e.getUsername(),
            e.isCanDeleteVisitors(), e.getPermissions().stream().sorted().toList());
    }
}
