package com.amitra.commercemesh.cart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DeliveryAddressRequest(
        @NotBlank @Size(max = 120) String recipientName,
        @NotBlank @Pattern(regexp = "^[0-9]{8,15}$", message = "Phone number must contain 8 to 15 digits") String phoneNumber,
        @NotBlank @Size(max = 200) String addressLine1,
        @Size(max = 200) String addressLine2,
        @NotBlank @Size(max = 120) String city,
        @NotBlank @Size(max = 120) String state,
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9 -]{4,12}$", message = "Postal code must be 4 to 12 characters") String postalCode,
        @NotBlank @Size(max = 120) String country
) {}
