package com.egaz.visitors.config;

import com.egaz.visitors.entity.Role;
import com.egaz.visitors.entity.User;
import com.egaz.visitors.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedUsers(UserRepository repository) {
        return args -> {
            if (repository.count() > 0) return;

            repository.save(createUser("Admin", "admin", "admin", Role.admin));
            repository.save(createUser("Receptionist", "receptionist", "receptionist", Role.receptionist));
        };
    }

    private User createUser(String fullname, String username, String password, Role role) {
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setFullname(fullname);
        user.setUsername(username);
        user.setPassword(password);
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }
}
