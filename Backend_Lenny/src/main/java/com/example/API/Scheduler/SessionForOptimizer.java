package com.example.API.Scheduler;

import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.variable.PlanningVariable;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import java.time.LocalDate;
import java.time.LocalTime;

@PlanningEntity
public class SessionForOptimizer {
	private TaskForOptimizer task;
	@PlanningId
    private Long sid;
	//variables to change when planning
	@PlanningVariable(valueRangeProviderRefs = "dateRange")
	private LocalDate date;
	@PlanningVariable(valueRangeProviderRefs = "timeRange")
	private LocalTime startTime;
	//constructors
	public SessionForOptimizer() {}
	public SessionForOptimizer(TaskForOptimizer task) {
		this.task = task;	}
	//setters, getters
	public TaskForOptimizer getTask() {
        return task;    }
    public void setTask(TaskForOptimizer task) {
        this.task = task;    }
    public LocalDate getDate() {
        return date;    }
    public void setDate(LocalDate date) {
        this.date = date;    }
    public LocalTime getStartTime() {
        return startTime;    }
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;    }
    public long getId() {
    	return this.sid;    }
    public void setId(long Id) {
    	this.sid = Id;    }
    
    //methods
    public LocalTime getEndTime() {
    	if (startTime == null) return null;
    	long minutes = Math.round(task.getSessionDuration()*60);
    	return this.startTime.plusMinutes(minutes);
    }
    
    @Override
    public String toString() {
        return "Session for " + task.getName() + " on " + date + " at " + startTime;
    }
}

