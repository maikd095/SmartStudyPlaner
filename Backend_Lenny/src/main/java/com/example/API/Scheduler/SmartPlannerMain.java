package com.example.API.Scheduler;

import java.time.LocalTime;
import java.time.LocalDate;
import java.time.Duration;
import java.util.ArrayList;
//import java.util.Collections;
import java.util.List;
import java.util.Objects;
//import java.util.Map;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.SolverConfig;

public class SmartPlannerMain {
	public static void main(String[] args) {
		List<TaskForOptimizer> tasks = loadTasks();
		List<FixedEvent> events = loadFixedEvents();
		List<LocalDate> dateRange = generateDateRange(tasks);
		List<LocalTime> timeRange = generateTimeRange();
		List<SessionForOptimizer> sessions = generateSessions(tasks);
		
		System.out.println("Events: " + events.size());
		System.out.println("Tasks: " + tasks.size());
		System.out.println("Sessions: " + sessions.size());
		
		//Set up the planning problem
        LearningSchedule schedule = new LearningSchedule(tasks, sessions);
        schedule.setDateRange(dateRange);
        schedule.setTimeRange(timeRange);
        schedule.setFixedEventList(events);
        
        //Create solver
        SolverFactory<LearningSchedule> solverFactory = SolverFactory.create(
            new SolverConfig()
                .withSolutionClass(LearningSchedule.class)
                .withEntityClasses(SessionForOptimizer.class)
                .withConstraintProviderClass(Constraints.class)
                .withTerminationSpentLimit(Duration.ofSeconds(8))//restriction on running time
                //.withScoreDirectorFactory(ScoreDirectorFactoryConfig::new) это убрать
        );
        Solver<LearningSchedule> solver = solverFactory.buildSolver();
        
        //Solve the schedule
        LearningSchedule solved = solver.solve(schedule);
        
        //Output result
        for (SessionForOptimizer session : solved.getSessionList()) {
            System.out.println(session.getTask().getName() + " on " +
                               session.getDate() + " at " +
                               session.getStartTime());
        }
	}



	private static List<TaskForOptimizer> loadTasks() {
		List<TaskForOptimizer> tasks = new ArrayList<>();
		tasks.add(new TaskForOptimizer("Database Systems", 8, LocalDate.of(2025, 6, 11), 2, 0.5));
		tasks.add(new TaskForOptimizer("Software Development", 9, LocalDate.of(2025, 6, 12), 3, 0.5));
		tasks.add(new TaskForOptimizer("Infrastructure", 7, LocalDate.of(2025, 6, 13), 1, 0.2));
		return tasks;
	}

	private static List<FixedEvent> loadFixedEvents() {
		List<FixedEvent> events = new ArrayList<>();
		events.add(new FixedEvent(LocalDate.of(2025, 6, 11), LocalTime.of(12, 30), LocalTime.of(14, 0)));
		events.add(new FixedEvent(LocalDate.of(2025, 6, 11), LocalTime.of(15, 20), LocalTime.of(15, 40)));
		return events;
	}
	private static List<LocalDate> generateDateRange(List<TaskForOptimizer> taskList) {
	List<LocalDate> dates = new ArrayList<>();
	LocalDate start = LocalDate.now().plusDays(1);
    LocalDate end = findLatestDeadline(taskList);
    System.out.println("Possible days from " + start + " to " + end);
    while (!start.isAfter(end)) {
        dates.add(start);
        start = start.plusDays(1);
    }
    return dates;
	}

	private static List<LocalTime> generateTimeRange() {
		List<LocalTime> times = new ArrayList<>();
		LocalTime time = LocalTime.of(9, 0);
		while (time.isBefore(LocalTime.of(22, 0))) {
			times.add(time);
			time = time.plusMinutes(10);//session starting slots frequency
		}
		return times;
	}

	private static List<SessionForOptimizer> generateSessions(List<TaskForOptimizer> taskList){
		List<SessionForOptimizer> sessions = new ArrayList<>();
		long idCounter = 0;
		for (TaskForOptimizer task : taskList) {
			for (int i = 0; i < task.getRecommendedSessionCount(); i++) {
				SessionForOptimizer session = new SessionForOptimizer(task);
				session.setId(idCounter++);
				sessions.add(session);
			}
		}
		return sessions;
	}
	
	public static LocalDate findLatestDeadline(List<TaskForOptimizer> tasks) {
	    return tasks.stream()
	        .map(TaskForOptimizer::getDeadline)
	        .filter(Objects::nonNull)
	        .max(LocalDate::compareTo)
	        .orElse(LocalDate.now().plusDays(30));
	}
}
