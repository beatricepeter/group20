package com.egaz.visitors.service;

import com.egaz.visitors.dto.LoginRequest;
import com.egaz.visitors.dto.LoginResponse;
import com.egaz.visitors.entity.Expert;
import com.egaz.visitors.entity.User;
import com.egaz.visitors.exception.ResourceNotFoundException;
import com.egaz.visitors.repository.ExpertRepository;
import com.egaz.visitors.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class  AuthService {
    private final UserRepository userRepository;
    private final ExpertRepository expertRepository;

    public AuthService(UserRepository userRepository, ExpertRepository expertRepository) {
        this.userRepository = userRepository;
        this.expertRepository = expertRepository;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request == null || request.username() == null || request.username().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("username and password are required");
        }
        String username = request.username().trim();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            if (!user.isEnabled() || !request.password().equals(user.getPassword())) {
                throw new ResourceNotFoundException("Invalid username or password");
            }
            return new LoginResponse(user.getId(), user.getFullname(), user.getUsername(),
                user.getRole().name(), user.isCanDeleteVisitors(),
                user.getPermissions().stream().sorted().toList());
        }

        Expert expert = expertRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password"));
        if (expert.getPassword() == null || !request.password().equals(expert.getPassword())) {
            throw new ResourceNotFoundException("Invalid username or password");
        }
        return new LoginResponse(expert.getId(), expert.getFullname(), expert.getUsername(),
            "expert", expert.isCanDeleteVisitors(), expert.getPermissions().stream().sorted().toList());
    }
}
