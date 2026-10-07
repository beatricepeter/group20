package com.egaz.visitors.dto;

import java.time.LocalDateTime;

public record VisitorResponse(
    String id,
    String fullName,
    String firstName,
    String lastName,
    String email,
    String phone,
    String company,
    String idType,
    String idNumber,
    String expertId,
    String expertName,
    String personToVisit,
    String purpose,
    String recordedBy,
    LocalDateTime checkInDate,
    LocalDateTime checkOutDate,
    String checkoutReference
) {
}
