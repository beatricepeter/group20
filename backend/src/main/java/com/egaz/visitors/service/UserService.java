package com.egaz.visitors.service;

import com.egaz.visitors.dto.UserRequest;
import com.egaz.visitors.dto.UserResponse;
import com.egaz.visitors.repository.ExpertRepository;
import com.egaz.visitors.entity.Role;
import com.egaz.visitors.entity.User;
import com.egaz.visitors.exception.ConflictException;
import com.egaz.visitors.exception.ResourceNotFoundException;
import com.egaz.visitors.repository.UserRepository;
import java.util.List;
import java.util.HashSet;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {
    private final UserRepository repository;
    private final ExpertRepository expertRepository;

    public UserService(UserRepository repository, ExpertRepository expertRepository) {
        this.repository = repository;
        this.expertRepository = expertRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse findById(String id) {
        return toResponse(get(id));
    }

    @Transactional(readOnly = true)
    public UserResponse findByUsername(String username) {
        return toResponse(repository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username)));
    }

    public UserResponse create(UserRequest request) {
        validate(request, true);
        if (repository.existsByUsername(request.username().trim())
            || expertRepository.existsByUsername(request.username().trim())) {
            throw new ConflictException("Username already exists: " + request.username());
        }
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        apply(user, request, true);
        return toResponse(repository.save(user));
    }

    public UserResponse update(String id, UserRequest request) {
        validate(request, false);
        User user = get(id);
        String username = request.username().trim();
        if (!username.equals(user.getUsername()) && (repository.existsByUsername(username)
            || expertRepository.existsByUsername(username))) {
            throw new ConflictException("Username already exists: " + username);
        }
        apply(user, request, false);
        return toResponse(repository.save(user));
    }

    public void delete(String id) {
        repository.delete(get(id));
    }

    private User get(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void validate(UserRequest r, boolean passwordRequired) {
        if (r == null || blank(r.fullname()) || blank(r.username()) || (passwordRequired && blank(r.password()))) {
            throw new IllegalArgumentException("fullname, username and password are required when creating a user");
        }
    }

    private void apply(User u, UserRequest r, boolean creating) {
        u.setFullname(r.fullname().trim());
        u.setUsername(r.username().trim());
        if (!blank(r.password())) u.setPassword(r.password());
        if (r.role() != null) u.setRole(r.role());
        else if (creating) u.setRole(Role.receptionist);
        if (r.permissions() != null) {
            u.setPermissions(new HashSet<>(r.permissions()));
            u.setCanDeleteVisitors(u.getPermissions().contains("visitors.delete"));
        } else if (r.canDeleteVisitors() != null) {
            u.setCanDeleteVisitors(r.canDeleteVisitors());
        }
        if (u.isCanDeleteVisitors()) u.getPermissions().add("visitors.delete");
        else if (r.canDeleteVisitors() != null || r.permissions() != null) u.getPermissions().remove("visitors.delete");
        if (creating && u.getCreatedAt() == null) u.setCreatedAt(java.time.LocalDateTime.now());
    }

    private boolean blank(String s) { return s == null || s.trim().isEmpty(); }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getFullname(), u.getUsername(), u.getRole(), u.getCreatedAt(),
            u.isCanDeleteVisitors(), u.getPermissions().stream().sorted().toList());
    }
}
