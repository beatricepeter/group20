package com.egaz.visitors.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.egaz.visitors.dto.SystemSettingsRequest;
import com.egaz.visitors.entity.SystemSettings;
import com.egaz.visitors.repository.SystemSettingsRepository;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SystemSettingsServiceTest {

    @Mock
    private SystemSettingsRepository repository;

    @Test
    void getSettingsUsesExistingDefaultCheckoutTime() {
        SystemSettingsService service = new SystemSettingsService(repository);

        assertEquals("16:30", service.getSettings().autoCheckoutTime());
    }

    @Test
    void updateSettingsPersistsConfiguredCheckoutTime() {
        when(repository.findById("global")).thenReturn(Optional.empty());
        when(repository.save(any(SystemSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));
        SystemSettingsService service = new SystemSettingsService(repository);

        assertEquals("18:15", service.updateSettings(new SystemSettingsRequest("18:15")).autoCheckoutTime());
        verify(repository).save(any(SystemSettings.class));
    }

    @Test
    void autoCheckoutTimeUsesPersistedTime() {
        SystemSettings settings = new SystemSettings();
        settings.setId("global");
        settings.setAutoCheckoutTime(LocalTime.of(18, 15));
        when(repository.findById("global")).thenReturn(Optional.of(settings));
        SystemSettingsService service = new SystemSettingsService(repository);

        assertEquals(LocalTime.of(18, 15), service.getAutoCheckoutTime());
    }

    @Test
    void updateSettingsRejectsInvalidTime() {
        SystemSettingsService service = new SystemSettingsService(repository);

        assertThrows(
            IllegalArgumentException.class,
            () -> service.updateSettings(new SystemSettingsRequest("25:99"))
        );
    }
}
