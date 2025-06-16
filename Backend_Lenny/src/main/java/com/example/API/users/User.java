package com.example.API.users;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "username",unique = true, nullable = false)
    private String username;

    @Column(name = "password",nullable = false)
    private String password;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "creation_date", updatable = false)
    private LocalDateTime creationDate;

    @Column(name = "pref_start_time")
    private LocalTime prefStartTime;

    @Column(name = "pref_end_time")
    private LocalTime prefEndTime;

    @Column(name = "pref_session_length")
    private Integer prefSessionLength;

    @Column(name = "pref_break_length")
    private Integer prefBreakLength;

    @Column(name = "enable_notifications")
    private Boolean enableNotifications;

    @Column(name = "dark_mode")
    private Boolean darkMode;

    // Standard Konstruktor
    public User() {
    }

    // Konstruktor mit Parametern
    public User(String username, String email, String password, String firstName, String lastName, LocalDateTime creationDate, LocalTime prefStartTime, LocalTime prefEndTime, Integer prefSessionLength, Integer prefBreakLength, Boolean enableNotifications, Boolean darkMode) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.creationDate = creationDate;
        this.prefStartTime = prefStartTime;
        this.prefEndTime = prefEndTime;
        this.prefSessionLength = prefSessionLength;
        this.prefBreakLength = prefBreakLength;
        this.enableNotifications = enableNotifications;
        this.darkMode = darkMode;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public LocalDateTime getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(LocalDateTime creationDate) {
        this.creationDate = creationDate;
    }

    public LocalTime getPrefStartTime() {
        return prefStartTime;
    }

    public void setPrefStartTime(LocalTime prefStartTime) {
        this.prefStartTime = prefStartTime;
    }

    public LocalTime getPrefEndTime() {
        return prefEndTime;
    }

    public void setPrefEndTime(LocalTime prefEndTime) {
        this.prefEndTime = prefEndTime;
    }

    public Integer getPrefSessionLength() {
        return prefSessionLength;
    }

    public void setPrefSessionLength(Integer prefSessionLength) {
        this.prefSessionLength = prefSessionLength;
    }

    public Integer getPrefBreakLength() {
        return prefBreakLength;
    }

    public void setPrefBreakLength(Integer prefBreakLength) {
        this.prefBreakLength = prefBreakLength;
    }

    public Boolean getEnableNotifications() {
        return enableNotifications;
    }

    public void setEnableNotifications(Boolean enableNotifications) {
        this.enableNotifications = enableNotifications;
    }

    public Boolean getDarkMode() {
        return darkMode;
    }

    public void setDarkMode(Boolean darkMode) {
        this.darkMode = darkMode;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long user_id) {
        this.userId = user_id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(userId, user.userId) &&
                Objects.equals(email, user.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, email);
    }
}