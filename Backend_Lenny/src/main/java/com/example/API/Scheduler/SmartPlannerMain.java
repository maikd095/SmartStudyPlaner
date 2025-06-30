package com.example.API.Scheduler;

import java.time.LocalTime;
import java.time.LocalDate;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.optaplanner.core.api.solver.Solver;
import org.optaplanner.core.api.solver.SolverFactory;
import org.optaplanner.core.config.solver.SolverConfig;
import org.optaplanner.core.config.solver.termination.TerminationConfig;

public class SmartPlannerMain {
	public static void main(String[] args) { // Main + other following methods for testing; Left in for progress verification
		List<TaskForOptimizer> tasks = loadTasks();
		List<FixedEvent> events = loadFixedEvents();
		List<LocalDate> dateRange = generateDateRange(tasks);
		List<LocalTime> timeRange = generateTimeRange();
		List<SessionForOptimizer> sessions = generateSessions(tasks);

		System.out.println("Events: " + events.size());
		System.out.println("Tasks: " + tasks.size());
		System.out.println("Sessions: " + sessions.size());
		System.out.println("Date range: " + dateRange.size() + " days");
		System.out.println("Time slots: " + timeRange.size() + " slots");

		// Set up the planning problem
		LearningSchedule schedule = new LearningSchedule(tasks, sessions);
		schedule.setDateRange(dateRange);
		schedule.setTimeRange(timeRange);
		schedule.setFixedEventList(events);

		// Create solver with improved configuration
		Solver<LearningSchedule> solver = buildSolver();

		// Solve the schedule
		LearningSchedule solved = solver.solve(schedule);

		System.out.println("Final score: " + solved.getScore());

		// Output result
		for (SessionForOptimizer session : solved.getSessionList()) {
			System.out.println(session.getTask().getName() + " on " +
					session.getDate() + " at " +
					session.getStartTime() + " - " + session.getEndTime());
		}
	}

	/**
	 * Builds a Solver instance configured for optimizing a LearningSchedule.
	 *
	 * @return a Solver for solving and generating optimized LearningSchedule solutions.
	 */
	public static Solver<LearningSchedule> buildSolver() {
		SolverConfig solverConfig = new SolverConfig()
				.withSolutionClass(LearningSchedule.class)
				.withEntityClasses(SessionForOptimizer.class)
				.withConstraintProviderClass(Constraints.class);

		// termination config
		TerminationConfig terminationConfig = new TerminationConfig()
				.withSpentLimit(Duration.ofSeconds(30))  // limit duration to 30 seconds
				.withUnimprovedSpentLimit(Duration.ofSeconds(5)); // Stop after 5 seconds without improvement

		solverConfig.setTerminationConfig(terminationConfig);

		// Create solver with improved configuration
		SolverFactory<LearningSchedule> solverFactory = SolverFactory.create(solverConfig);
		return solverFactory.buildSolver();
	}

	private static List<TaskForOptimizer> loadTasks() {
		List<TaskForOptimizer> tasks = new ArrayList<>();
		tasks.add(new TaskForOptimizer("Database Systems", 8, LocalDate.of(2025, 6, 20), 2, 0.5));
		tasks.add(new TaskForOptimizer("Software Development", 9, LocalDate.of(2025, 6, 25), 3, 0.5));
		tasks.add(new TaskForOptimizer("Infrastructure", 7, LocalDate.of(2025, 6, 22), 1, 0.2));
		return tasks;
	}

	private static List<FixedEvent> loadFixedEvents() {
		List<FixedEvent> events = new ArrayList<>();
		events.add(new FixedEvent(LocalDate.of(2025, 6, 17), LocalTime.of(12, 30), LocalTime.of(14, 0)));
		events.add(new FixedEvent(LocalDate.of(2025, 6, 18), LocalTime.of(15, 20), LocalTime.of(15, 40)));
		return events;
	}

	public static List<LocalDate> generateDateRange(List<TaskForOptimizer> taskList) {
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
	// method for the testing; Overriding followed
	public static List<LocalTime> generateTimeRange() {
		return generateTimeRange(LocalTime.of(8, 0), LocalTime.of(22, 0));
	}

	/**
	 * Generates a list of time slots at 30-minute intervals within the specified start and end time range.
	 * If null => default values of 08:00 and 22:00 are used
	 *
	 * @param startTime the start time for generating the time range
	 * @param endTime the end time for generating the time range
	 * @return a list of LocalTime objects representing time slots at 30-minute intervals within the specified range
	 */
	public static List<LocalTime> generateTimeRange(LocalTime startTime, LocalTime endTime) {
		List<LocalTime> times = new ArrayList<>();

		// Checks when no preferred times are given
		if (startTime == null) {
			startTime = LocalTime.of(8, 0);
			System.out.println("Using default: 08:00");
		}
		if (endTime == null) {
			endTime = LocalTime.of(22, 0);
			System.out.println("Using default: 22:00");
		}

		// validate start and end time
		if (startTime.isAfter(endTime)) {
			System.out.println("Using standart times.");
			startTime = LocalTime.of(8, 0);
			endTime = LocalTime.of(22, 0);
		}

		System.out.println("Generating timeslots from " + startTime + " to " + endTime);

		LocalTime currentTime = startTime;
		while (currentTime.isBefore(endTime)) {
			times.add(currentTime);
			currentTime = currentTime.plusMinutes(30); // 30-minutes interval
		}

		System.out.println("Generated " + times.size() + " timeslots");
		return times;
	}

	/**
	 * Generates a list of sessions based on the tasks provided. Each task is distributed into sessions
	 * based on its session count
	 *
	 * @param taskList list of tasks for which sessions must be generated
	 * @return a list of SessionForOptimizer objects representing generated sessions for the tasks
	 */
	public static List<SessionForOptimizer> generateSessions(List<TaskForOptimizer> taskList) {
		List<SessionForOptimizer> sessions = new ArrayList<>();
		long idCounter = 0;

		// create a list with all tasks
		List<TaskSessionTracker> trackers = new ArrayList<>();
		for (TaskForOptimizer task : taskList) {
			int sessionCount = task.getRecommendedSessionCount();
			System.out.println("Task: " + task.getName() + " needs " + sessionCount + " sessions");
			trackers.add(new TaskSessionTracker(task, sessionCount));
		}

		// even distribute the sessions among the tasks based on the session count
		boolean hasRemainingSessions = true;
		while (hasRemainingSessions) {
			hasRemainingSessions = false;

			// go through all tasks and distribute sessions if there are remaining sessions left
			for (TaskSessionTracker tracker : trackers) {
				if (tracker.hasRemainingSessions()) {
					SessionForOptimizer session = new SessionForOptimizer(tracker.getTask());
					session.setId(idCounter++);
					sessions.add(session);

					tracker.decrementSessions();
					hasRemainingSessions = true;


				}
			}
		}

		System.out.println("Created " + sessions.size() + " sessions");
		return sessions;
	}

	// helper class for tracking the number of sessions for each task and checking if there are remaining sessions left
	private static class TaskSessionTracker {
		private final TaskForOptimizer task;
		private int remainingSessions;

		public TaskSessionTracker(TaskForOptimizer task, int sessionCount) {
			this.task = task;
			this.remainingSessions = sessionCount;
		}

		public TaskForOptimizer getTask() {
			return task;
		}

		public boolean hasRemainingSessions() {
			return remainingSessions > 0;
		}

		public void decrementSessions() {
			remainingSessions--;
		}

		public int getRemainingSessions() {
			return remainingSessions;
		}
	}

	// find the latest deadline for all tasks
	public static LocalDate findLatestDeadline(List<TaskForOptimizer> tasks) {
		return tasks.stream()
				.map(TaskForOptimizer::getDeadline)
				.filter(Objects::nonNull)
				.max(LocalDate::compareTo)
				.orElse(LocalDate.now().plusDays(30));
	}
}