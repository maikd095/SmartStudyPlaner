package com.example.API.Module;

import com.example.API.users.User;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "module")
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "hours_required", nullable = false)
    private double hoursRequired;

    @Column(name = "deadline", nullable = false)
    private LocalDate deadline;

    @Column(name = "ects", nullable = false)
    private Long ects;

    @Column(name = "already_studied")
    private Long alreadyStudied = 0L;

    @Column(name = "difficulty")
    private String difficulty = "mittel";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Default constructor
    public Module() {}

    // Constructor with required fields - not neccessary
    public Module(String name, double hoursRequired, LocalDate deadline, Long ects, User user) {
        this.name = name;
        this.hoursRequired = hoursRequired;
        this.deadline = deadline;
        this.ects = ects;
        this.user = user;
        this.alreadyStudied = 0L;
        this.difficulty = "middle";
    }

    // Getter & Setter
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getHoursRequired() {
        return hoursRequired;
    }

    public void setHoursRequired(double hoursRequired) {
        this.hoursRequired = hoursRequired;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public Long getEcts() {return ects;}

    public void setEcts(Long ects) {
        this.ects = ects;
    }
    public Long getAlreadyStudied() {
        return alreadyStudied;
    }

    public void setAlreadyStudied(Long alreadyStudied) {
        this.alreadyStudied = alreadyStudied;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
}
