package com.egaz.visitors.service;

import com.egaz.visitors.dto.AppointmentRequest;
import com.egaz.visitors.entity.Appointment;
import com.egaz.visitors.repository.AppointmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AppointmentService {
    private final AppointmentRepository repository;

    public AppointmentService(AppointmentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Appointment> findAll() {
        return repository.findAllByOrderByAppointmentDateAsc();
    }

    public Appointment create(AppointmentRequest request) {
        if (request == null || request.visitorName() == null || request.visitorName().isBlank()
            || request.phone() == null || request.phone().isBlank()
            || request.appointmentDate() == null) {
            throw new IllegalArgumentException("Visitor name, phone, and appointment date are required");
        }

        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID().toString());
        appointment.setVisitorName(request.visitorName().trim());
        appointment.setPhone(request.phone().trim());
        appointment.setAppointmentDate(request.appointmentDate());
        appointment.setPurpose(request.purpose() == null ? "" : request.purpose().trim());
        appointment.setStatus(request.status() == null || request.status().isBlank() ? "pending" : request.status().trim().toLowerCase());
        appointment.setCreatedAt(LocalDateTime.now());
        return repository.save(appointment);
    }
}
