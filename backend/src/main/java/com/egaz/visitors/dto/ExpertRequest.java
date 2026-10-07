package com.egaz.visitors.dto;

import java.util.List;

public record ExpertRequest(String fullname, String department, String username, String password,
	Boolean canDeleteVisitors, List<String> permissions) {
}
