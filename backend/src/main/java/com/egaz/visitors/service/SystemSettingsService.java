package com.egaz.visitors.service;

import com.egaz.visitors.dto.SystemSettingsRequest;
import com.egaz.visitors.dto.SystemSettingsResponse;
import com.egaz.visitors.entity.SystemSettings;
import com.egaz.visitors.repository.SystemSettingsRepository;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SystemSettingsService {
    private static final String SETTINGS_ID = "global";
    private static final LocalTime DEFAULT_AUTO_CHECKOUT_TIME = LocalTime.of(16, 30);
    private static final DateTimeFormatter TIME_FORMAT =
        DateTimeFormatter.ofPattern("HH:mm").withResolverStyle(ResolverStyle.STRICT);

    private final SystemSettingsRepository repository;

    public SystemSettingsService(SystemSettingsRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public SystemSettingsResponse getSettings() {
        return new SystemSettingsResponse(getAutoCheckoutTime().format(TIME_FORMAT));
    }

    @Transactional(readOnly = true)
    public LocalTime getAutoCheckoutTime() {
        return repository.findById(SETTINGS_ID)
            .map(SystemSettings::getAutoCheckoutTime)
            .orElse(DEFAULT_AUTO_CHECKOUT_TIME);
    }

    public SystemSettingsResponse updateSettings(SystemSettingsRequest request) {
        if (request == null || request.autoCheckoutTime() == null) {
            throw new IllegalArgumentException("autoCheckoutTime is required in HH:mm format");
        }

        LocalTime autoCheckoutTime;
        try {
            autoCheckoutTime = LocalTime.parse(request.autoCheckoutTime(), TIME_FORMAT);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("autoCheckoutTime must be a valid time in HH:mm format");
        }

        SystemSettings settings = repository.findById(SETTINGS_ID).orElseGet(() -> {
            SystemSettings created = new SystemSettings();
            created.setId(SETTINGS_ID);
            return created;
        });
        settings.setAutoCheckoutTime(autoCheckoutTime);
        repository.save(settings);

        return new SystemSettingsResponse(autoCheckoutTime.format(TIME_FORMAT));
    }
}
