package com.egaz.visitors.controller;

import com.egaz.visitors.dto.LoginRequest;
import com.egaz.visitors.dto.LoginResponse;
import com.egaz.visitors.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return service.login(request);
    }
}
