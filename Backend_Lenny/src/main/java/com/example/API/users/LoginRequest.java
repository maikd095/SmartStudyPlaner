package com.example.API.users;

public class LoginRequest {
    private String email;
    private String password;

    // Standard Konstruktor
    public LoginRequest() {
    }

    // Konstruktor mit Parametern
    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Getter und Setter
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}