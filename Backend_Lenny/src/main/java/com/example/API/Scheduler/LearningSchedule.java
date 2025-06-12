package com.example.API.Scheduler;

import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.domain.solution.PlanningScore;
//import org.optaplanner.core.api.domain.solution.ProblemFactProperty;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@PlanningSolution
public class LearningSchedule {
	
	private List<TaskForOptimizer> taskList;
    @PlanningEntityCollectionProperty
    private List<SessionForOptimizer> sessionList;
    @ValueRangeProvider(id = "dateRange")
    @ProblemFactCollectionProperty
    private List<LocalDate> dateRange;
    @ValueRangeProvider(id = "timeRange")
    @ProblemFactCollectionProperty
    private List<LocalTime> timeRange;
    @PlanningScore
    private HardSoftScore score;
    @ProblemFactCollectionProperty
    private List<FixedEvent> fixedEventList;
    //@ProblemFactProperty
    //private int preference;
    
    //constructors
    public LearningSchedule() {
    }
    public LearningSchedule(List<TaskForOptimizer> taskList, List<SessionForOptimizer> sessionList/*,
            List<LocalDate> dateRange, List<LocalTime> timeRange*/) {
    	this.taskList = taskList;
    	this.sessionList = sessionList;
    	//this.dateRange = dateRange;
    	//this.timeRange = timeRange;
    }
    
 // Getters and setters
    public List<TaskForOptimizer> getTaskList() {
        return taskList;	}
    public void setTaskList(List<TaskForOptimizer> taskList) {
        this.taskList = taskList;    }
    public List<LocalDate> getDateRange() {
        return dateRange;    }
    public void setDateRange(List<LocalDate> dateRange) {
        this.dateRange = dateRange;    }
    public List<LocalTime> getTimeRange() {
        return timeRange;    }
    public void setTimeRange(List<LocalTime> timeRange) {
        this.timeRange = timeRange;    }
    public List<SessionForOptimizer> getSessionList() {
        return sessionList;    }
    public void setSessionList(List<SessionForOptimizer> sessionList) {
        this.sessionList = sessionList;    }
    public HardSoftScore getScore() {
        return score;    }
    public void setScore(HardSoftScore score) {
        this.score = score;    }
    public List<FixedEvent> getFixedEventList() {
        return fixedEventList;    }
    public void setFixedEventList(List<FixedEvent> fixedEventList) {
        this.fixedEventList = fixedEventList;    }
    /*public ConstraintsConfiguration getConstraintConfiguration() {
        return constraintConfiguration;    }
    public void setConstraintConfiguration(ConstraintsConfiguration constraintConfiguration) {
        this.constraintConfiguration = constraintConfiguration;
    }*/
}

