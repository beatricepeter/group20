package com.egaz.visitors.dto;

import java.util.List;

public record ExpertResponse(String id, String fullname, String department, String username,
	boolean canDeleteVisitors, List<String> permissions) {
}
