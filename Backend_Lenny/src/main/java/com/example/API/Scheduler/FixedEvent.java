package com.example.API.Scheduler;

import java.time.LocalDate;
import java.time.LocalTime;

public class FixedEvent {
	private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;

    //constructor
    public FixedEvent(LocalDate date, LocalTime startTime, LocalTime endTime) {
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    //getters, setters
    public LocalDate getDate() {
    	return date;		}
    public LocalTime getStartTime() {
    	return startTime; 	}
    public LocalTime getEndTime() { 
    	return endTime;		}
}
