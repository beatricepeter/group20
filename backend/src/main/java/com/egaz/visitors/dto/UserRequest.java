package com.egaz.visitors.dto;

import com.egaz.visitors.entity.Role;
import java.util.List;

public record UserRequest(String fullname, String username, String password, Role role, Boolean canDeleteVisitors,
	List<String> permissions) {
}
