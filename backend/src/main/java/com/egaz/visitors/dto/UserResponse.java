package com.egaz.visitors.dto;

import com.egaz.visitors.entity.Role;
import java.time.LocalDateTime;
import java.util.List;

public record UserResponse(String id, String fullname, String username, Role role, LocalDateTime createdAt,
	boolean canDeleteVisitors, List<String> permissions, boolean enabled) {
}
