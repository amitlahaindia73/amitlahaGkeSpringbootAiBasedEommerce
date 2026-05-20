package com.amitra.commercemesh.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RefundRequest(@NotBlank String orderId, @Size(max = 255) String reason) {}
