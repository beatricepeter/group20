package com.egaz.visitors.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.egaz.visitors.dto.LoginRequest;
import com.egaz.visitors.entity.Role;
import com.egaz.visitors.entity.User;
import com.egaz.visitors.exception.ResourceNotFoundException;
import com.egaz.visitors.repository.ExpertRepository;
import com.egaz.visitors.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExpertRepository expertRepository;

    @Test
    void loginRejectsUserWhoseAccessWasRevoked() {
        User user = new User();
        user.setUsername("reception");
        user.setPassword("secret");
        user.setEnabled(false);
        when(userRepository.findByUsername("reception")).thenReturn(Optional.of(user));
        AuthService service = new AuthService(userRepository, expertRepository);

        assertThrows(
            ResourceNotFoundException.class,
            () -> service.login(new LoginRequest("reception", "secret"))
        );
    }

    @Test
    void loginAcceptsEnabledUser() {
        User user = new User();
        user.setId("user-1");
        user.setFullname("Reception User");
        user.setUsername("reception");
        user.setPassword("secret");
        user.setRole(Role.receptionist);
        when(userRepository.findByUsername("reception")).thenReturn(Optional.of(user));
        AuthService service = new AuthService(userRepository, expertRepository);

        assertEquals("user-1", service.login(new LoginRequest("reception", "secret")).id());
    }
}
