package com.egaz.visitors.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.egaz.visitors.dto.AppointmentRequest;
import com.egaz.visitors.entity.Appointment;
import com.egaz.visitors.repository.AppointmentRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

class AppointmentServiceTest {

    @Test
    void createRequiresVisitorNameAndAppointmentTime() {
        AppointmentRepository repository = Mockito.mock(AppointmentRepository.class);
        AppointmentService service = new AppointmentService(repository);

        assertThrows(IllegalArgumentException.class,
            () -> service.create(new AppointmentRequest(null, "0712345678", null, null, "")));

        assertThrows(IllegalArgumentException.class,
            () -> service.create(new AppointmentRequest("Amina", "0712345678", null, null, "")));
    }

    @Test
    void createPersistsValidAppointment() {
        AppointmentRepository repository = Mockito.mock(AppointmentRepository.class);
        AppointmentService service = new AppointmentService(repository);
        AppointmentRequest request = new AppointmentRequest(
            "Amina Hassan", "0712345678", LocalDateTime.of(2026, 10, 8, 9, 30), "Meeting", "pending");
        when(repository.save(org.mockito.ArgumentMatchers.any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment result = service.create(request);

        assertEquals("pending", result.getStatus());
        assertEquals("Amina Hassan", result.getVisitorName());
        assertEquals("0712345678", result.getPhone());
        assertEquals("pending", result.getStatus());
    }
}
