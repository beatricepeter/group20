package com.egaz.visitors.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.egaz.visitors.dto.UserRequest;
import com.egaz.visitors.entity.Role;
import com.egaz.visitors.entity.User;
import com.egaz.visitors.repository.ExpertRepository;
import com.egaz.visitors.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExpertRepository expertRepository;

    @Test
    void updateCanRevokeUserAccess() {
        User user = new User();
        user.setId("user-1");
        user.setFullname("Reception User");
        user.setUsername("reception");
        user.setPassword("secret");
        user.setRole(Role.receptionist);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserService service = new UserService(userRepository, expertRepository);

        var updated = service.update("user-1", new UserRequest(
            "Reception User",
            "reception",
            "",
            Role.receptionist,
            false,
            null,
            false
        ));

        assertFalse(updated.enabled());
    }

    @Test
    void updateCannotDisableDefaultAdminAccount() {
        User admin = new User();
        admin.setId("admin-1");
        admin.setFullname("Admin");
        admin.setUsername("admin");
        admin.setPassword("secret");
        admin.setRole(Role.admin);
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(admin));
        UserService service = new UserService(userRepository, expertRepository);

        assertThrows(
            IllegalArgumentException.class,
            () -> service.update("admin-1", new UserRequest(
                "Admin",
                "admin",
                "",
                Role.admin,
                false,
                null,
                false
            ))
        );
    }
}
