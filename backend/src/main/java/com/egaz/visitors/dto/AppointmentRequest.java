package com.egaz.visitors.dto;

import java.time.LocalDateTime;

public record AppointmentRequest(
    String visitorName,
    String phone,
    LocalDateTime appointmentDate,
    String purpose,
    String status
) {
}
