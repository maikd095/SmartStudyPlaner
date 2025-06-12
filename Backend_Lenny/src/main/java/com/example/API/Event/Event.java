package com.example.API.Event;

import com.example.API.users.User;
import jakarta.persistence.*;

//Nutzung von LocalDate & LocalTime da besser nutzbar
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "event") // Name deiner Tabelle in der Datenbank
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String type;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "isFullDay")
    private Boolean isFullDay = false;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Standard-Konstruktor
    public Event() {
    }

    // Getter & Setter
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }



    public Boolean getIsFullDay() {
        return isFullDay != null ? isFullDay : false;
    }

    public void setIsFullDay(Boolean isFullDay) {
        this.isFullDay = isFullDay;
    }


    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
}