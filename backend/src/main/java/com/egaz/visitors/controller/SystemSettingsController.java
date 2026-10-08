package com.egaz.visitors.controller;

import com.egaz.visitors.dto.SystemSettingsRequest;
import com.egaz.visitors.dto.SystemSettingsResponse;
import com.egaz.visitors.service.SystemSettingsService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class SystemSettingsController {
    private final SystemSettingsService service;

    public SystemSettingsController(SystemSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public SystemSettingsResponse getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public SystemSettingsResponse updateSettings(@RequestBody SystemSettingsRequest request) {
        return service.updateSettings(request);
    }
}
