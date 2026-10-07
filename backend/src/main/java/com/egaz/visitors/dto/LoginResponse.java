package com.egaz.visitors.dto;

import java.util.List;

public record LoginResponse(String id, String fullname, String username, String role, boolean canDeleteVisitors,
	List<String> permissions) {
}
