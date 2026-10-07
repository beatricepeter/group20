package com.egaz.visitors.repository;

import com.egaz.visitors.entity.Appointment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {
    List<Appointment> findAllByOrderByAppointmentDateAsc();
}
