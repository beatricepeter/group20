package com.egaz.visitors.dto;

import java.time.LocalDateTime;

public record CheckoutRequest(LocalDateTime checkOutDate, String reference) {
}
