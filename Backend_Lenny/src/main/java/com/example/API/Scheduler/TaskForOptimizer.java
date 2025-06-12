package com.example.API.Scheduler;

import java.time.LocalDate;

public class TaskForOptimizer {
	private String name;
    private double hoursRequired;
    private LocalDate deadline;
    private double sessionDuration;
    private double studyTime;
    
    //constructor
    public TaskForOptimizer(String name, double hoursRequired, LocalDate deadline, double sessionDuration, double breakDuration) {
    	this.name = name;
    	this.hoursRequired = hoursRequired;
    	this.deadline = deadline;
    	this.sessionDuration = sessionDuration + breakDuration;
    	this.studyTime = sessionDuration;
    	}
    
    //Setters, getters
    public String getName() {
        return name;    }
    public void setName(String name) {
        this.name = name;    }
    public double getHoursRequired() {
        return hoursRequired;    }
    public void setHoursRequired(int hoursRequired) {
        this.hoursRequired = hoursRequired;    }
    public LocalDate getDeadline() {
        return deadline;    }
    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;    }
    public double getSessionDuration() {
        return sessionDuration;    }
    public void setSessionDuration(int sessionDuration) {
        this.sessionDuration = sessionDuration;    }
    
    //methods
    public int getRecommendedSessionCount() {
    	return (int) Math.ceil(this.hoursRequired/this.studyTime);
    }
}
