package com.amitra.commercemesh.user.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "user_profile", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_profile_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_user_profile_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_user_profile_external_auth_id", columnNames = "external_auth_id")
})
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String username;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(nullable = false, length = 160)
    private String fullName;

    @Column(name = "external_auth_id", length = 120)
    private String externalAuthId;

    @Column(name = "phone_number", length = 40)
    private String phoneNumber;

    @Column(name = "address_line_1", length = 200)
    private String addressLine1;

    @Column(name = "address_line_2", length = 200)
    private String addressLine2;

    @Column(length = 120)
    private String city;

    @Column(length = 120)
    private String state;

    @Column(name = "postal_code", length = 40)
    private String postalCode;

    @Column(length = 120)
    private String country;

    public UserProfile() {}

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getExternalAuthId() { return externalAuthId; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddressLine1() { return addressLine1; }
    public String getAddressLine2() { return addressLine2; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getPostalCode() { return postalCode; }
    public String getCountry() { return country; }

    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setExternalAuthId(String externalAuthId) { this.externalAuthId = externalAuthId; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }
    public void setCity(String city) { this.city = city; }
    public void setState(String state) { this.state = state; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public void setCountry(String country) { this.country = country; }

    @Transient
    public boolean isProfileComplete() {
        return hasText(phoneNumber) && hasText(addressLine1) && hasText(city) && hasText(state) && hasText(postalCode) && hasText(country);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
