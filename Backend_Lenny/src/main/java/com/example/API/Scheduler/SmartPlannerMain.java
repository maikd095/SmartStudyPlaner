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
	public static void main(String[] args) { // Main for testing; Left in for progress verification
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

	public static Solver<LearningSchedule> buildSolver() {
		SolverConfig solverConfig = new SolverConfig()
				.withSolutionClass(LearningSchedule.class)
				.withEntityClasses(SessionForOptimizer.class)
				.withConstraintProviderClass(Constraints.class);

		// Verbesserte Termination-Konfiguration
		TerminationConfig terminationConfig = new TerminationConfig()
				.withSpentLimit(Duration.ofSeconds(30)) // Längere Laufzeit
				.withUnimprovedSpentLimit(Duration.ofSeconds(10)); // Stoppe wenn 10s keine Verbesserung

		solverConfig.setTerminationConfig(terminationConfig);

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

	public static List<LocalTime> generateTimeRange() {
		// Fallback für bestehende Aufrufe
		return generateTimeRange(LocalTime.of(8, 0), LocalTime.of(22, 0));
	}

	public static List<LocalTime> generateTimeRange(LocalTime startTime, LocalTime endTime) {
		List<LocalTime> times = new ArrayList<>();

		// Checks when no preferred times are given
		if (startTime == null) {
			startTime = LocalTime.of(8, 0);
			System.out.println("Warnung: Keine bevorzugte Startzeit gefunden, verwende 08:00");
		}
		if (endTime == null) {
			endTime = LocalTime.of(22, 0);
			System.out.println("Warnung: Keine bevorzugte Endzeit gefunden, verwende 22:00");
		}

		// Validierung: Startzeit muss vor Endzeit liegen
		if (startTime.isAfter(endTime)) {
			System.out.println("Warnung: Startzeit liegt nach Endzeit. Verwende Standard-Zeiten.");
			startTime = LocalTime.of(8, 0);
			endTime = LocalTime.of(22, 0);
		}

		System.out.println("Generiere Zeitslots von " + startTime + " bis " + endTime);

		LocalTime currentTime = startTime;
		while (currentTime.isBefore(endTime)) {
			times.add(currentTime);
			currentTime = currentTime.plusMinutes(30); // 30-Minuten-Schritte
		}

		System.out.println("Generierte " + times.size() + " Zeitslots");
		return times;
	}

	public static List<SessionForOptimizer> generateSessions(List<TaskForOptimizer> taskList) {
		List<SessionForOptimizer> sessions = new ArrayList<>();
		long idCounter = 0;

		// Erstelle eine Liste mit allen Tasks und ihren verbleibenden Sessions
		List<TaskSessionTracker> trackers = new ArrayList<>();
		for (TaskForOptimizer task : taskList) {
			int sessionCount = task.getRecommendedSessionCount();
			System.out.println("Task: " + task.getName() + " benötigt " + sessionCount + " Sessions");
			trackers.add(new TaskSessionTracker(task, sessionCount));
		}

		// Gleichmäßige Verteilung: Rotiere durch alle Tasks
		boolean hasRemainingSessions = true;
		while (hasRemainingSessions) {
			hasRemainingSessions = false;

			// Gehe durch alle Tasks und erstelle jeweils eine Session
			for (TaskSessionTracker tracker : trackers) {
				if (tracker.hasRemainingSessions()) {
					SessionForOptimizer session = new SessionForOptimizer(tracker.getTask());
					session.setId(idCounter++);
					sessions.add(session);

					tracker.decrementSessions();
					hasRemainingSessions = true;

					System.out.println("Session " + idCounter + " erstellt für: " + tracker.getTask().getName() +
							" (noch " + tracker.getRemainingSessions() + " Sessions übrig)");
				}
			}
		}

		System.out.println("Insgesamt " + sessions.size() + " Sessions erstellt mit gleichmäßiger Verteilung");
		return sessions;
	}

	// Hilfsklasse für das Tracking der Sessions pro Task
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

	public static LocalDate findLatestDeadline(List<TaskForOptimizer> tasks) {
		return tasks.stream()
				.map(TaskForOptimizer::getDeadline)
				.filter(Objects::nonNull)
				.max(LocalDate::compareTo)
				.orElse(LocalDate.now().plusDays(30));
	}
}