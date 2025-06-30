package com.example.API.Scheduler;

import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import static org.optaplanner.core.api.score.stream.Joiners.equal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

public class Constraints implements ConstraintProvider {
	/**
	 * Define the constraints of the planning problem.
	 * @param factory: ConstraintFactory to create the constraints.
	 * @return An array of constraints.
	 */
	@Override
	public Constraint[] defineConstraints(ConstraintFactory factory) {
		return new Constraint[] {
				noOverlappingSessions(factory),
				prioritizeEarlyDeadlines(factory),
				avoidFixedEventOverlap(factory),
				encourageTimeDistribution(factory),
				minimizeSameTimeSlots(factory),
				enforceBreakBetweenSessions(factory),
				respectUserPreferredHours(factory),
				encourageEvenDistributionUntilDeadline(factory)
		};
	}

	/**
	 * No overlapping sessions constraint.
	 * @param factory: ConstraintFactory to create the constraint.
	 * @return A constraint that checks for overlapping sessions.
	 */
	private Constraint noOverlappingSessions(ConstraintFactory factory) {
		return factory.forEachUniquePair(SessionForOptimizer.class,
						equal(SessionForOptimizer::getDate))
				.filter((a, b) -> {
					LocalTime aStart = a.getStartTime();
					LocalTime bStart = b.getStartTime();
					if (aStart == null || bStart == null) return false;
					LocalTime aEnd = a.getEndTime();
					LocalTime bEnd = b.getEndTime();
					// Check if sessions overlap
					boolean overlap = aStart.isBefore(bEnd) && bStart.isBefore(aEnd);
					return overlap;
				})
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("Overlapping sessions");
	}

	/**
	 * Prioritize early deadlines constraint.
	 * @param factory: ConstraintFactory to create the constraint.
	 * @return A constraint that prioritizes early deadlines.
	 */
	private Constraint prioritizeEarlyDeadlines(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.penalize(HardSoftScore.ONE_SOFT,
						session -> {
							TaskForOptimizer task = session.getTask();
							if (session.getDate() == null || task.getDeadline() == null) return 0;
							long daysLate = session.getDate().toEpochDay() - task.getDeadline().toEpochDay();
							return daysLate > 0 ? (int) daysLate * 10 : 0; // Stärkere Penalisierung
						}).asConstraint("Late session for early deadline");
	}

	/**
	 * Creates a constraint to avoid overlapping between planned sessions and fixed events
	 *
	 * @param factory: ConstraintFactory to create the constraint.
	 * @return a constraint that penalizes overlapping sessions and fixed events with a hard score
	 */
	private Constraint avoidFixedEventOverlap(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.join(FixedEvent.class,
						equal(SessionForOptimizer::getDate, FixedEvent::getDate))
				.filter((session, event) -> {
					if (session.getStartTime() == null || session.getEndTime() == null)
						return false;
					if (event.getStartTime() == null || event.getEndTime() == null)
						return false;

					// check if session overlaps with fixed event and if the session is not fully contained in the fixed event
					return session.getStartTime().isBefore(event.getEndTime()) &&
							session.getEndTime().isAfter(event.getStartTime());
				})
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("Session overlaps with fixed event");
	}

	/**
	 * Creates a constraint that penalizes sessions scheduled on the same date and at the same start time.
	 * @param factory ConstraintFactory used to create constraints.
	 * @return A hard constraint that imposes penalties for scheduling sessions simultaneously.
	 */
	private Constraint encourageTimeDistribution(ConstraintFactory factory) {
		return factory.forEachUniquePair(SessionForOptimizer.class)
				.filter((a, b) -> {
					// no sessions scheduled on the same date and at the same start time
					return a.getDate() != null && b.getDate() != null &&
							a.getStartTime() != null && b.getStartTime() != null &&
							a.getDate().equals(b.getDate()) &&
							a.getStartTime().equals(b.getStartTime());
				})
				.penalize(HardSoftScore.ONE_HARD) // ← HART statt Soft!
				.asConstraint("No simultaneous sessions");
	}

	/**
	 * Creates a constraint to minimize scheduling multiple sessions at the same start time on the same date.
	 *
	 * @param factory: ConstraintFactory used to create constraints within the planning framework.
	 * @return A hard constraint that applies a penalty when multiple sessions are scheduled at the same time slot.
	 */
	private Constraint minimizeSameTimeSlots(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.groupBy(SessionForOptimizer::getStartTime,
						SessionForOptimizer::getDate,
						org.optaplanner.core.api.score.stream.ConstraintCollectors.count())
				.filter((time, date, count) -> count > 1)
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("No sessions at same time slot");
	}

	/**
	 * Creates a constraint to enforce a mandatory break period between sessions
	 * @param factory: The ConstraintFactory used to build the constraint.
	 * @return A hard constraint that penalizes sessions scheduled without sufficient break time between them.
	 */
	private Constraint enforceBreakBetweenSessions(ConstraintFactory factory) {
		return factory.forEachUniquePair(SessionForOptimizer.class,
						equal(SessionForOptimizer::getDate))
				.filter((sessionA, sessionB) -> {
					if (sessionA.getStartTime() == null || sessionB.getStartTime() == null)
						return false;
					if (sessionA.getEndTime() == null || sessionB.getEndTime() == null)
						return false;

					// Use a default break length (you can make this configurable via problem facts)
					int breakMinutes = 15; // Default break length

					// check if sessions overlap and if the break is sufficient between them
					LocalTime endA = sessionA.getEndTime();
					LocalTime startB = sessionB.getStartTime();
					LocalTime endB = sessionB.getEndTime();
					LocalTime startA = sessionA.getStartTime();

					boolean needsBreakAtoB = endA.equals(startB) ||
							(endA.isBefore(startB) && endA.plusMinutes(breakMinutes).isAfter(startB));

					boolean needsBreakBtoA = endB.equals(startA) ||
							(endB.isBefore(startA) && endB.plusMinutes(breakMinutes).isAfter(startA));

					return needsBreakAtoB || needsBreakBtoA;
				})
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("Insufficient break between sessions");
	}

	/**
	 * Creates a constraint to ensure that sessions are scheduled within user-preferred hours.
	 * Sessions outside  of the default preferred times are penalized with a soft score, so it's possible to schedule smth. there if neccessary
	 *
	 * @param factory: the ConstraintFactory used to build the constraint.
	 * @return a soft constraint that penalizes sessions scheduled outside the preferred hours.
	 */
	private Constraint respectUserPreferredHours(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.filter((session) -> {
					if (session.getStartTime() == null) return false;

					// Use default preferred hours (you can make this configurable via problem facts)
					LocalTime prefStart = LocalTime.of(8, 0); // Default start time
					LocalTime prefEnd = LocalTime.of(22, 0);   // Default end time
					LocalTime sessionStart = session.getStartTime();
					LocalTime sessionEnd = session.getEndTime();

					if (sessionEnd == null) return false;

					// session starts before preferred hours and ends after preferred hours
					boolean startsBeforePreferred = sessionStart.isBefore(prefStart);
					boolean endsAfterPreferred = sessionEnd.isAfter(prefEnd);

					return startsBeforePreferred || endsAfterPreferred;
				})
				.penalize(HardSoftScore.ONE_SOFT)
				.asConstraint("Session outside preferred hours");
	}

	/**
	 * Improved constraint that distributes sessions evenly across the timeline until deadline.
	 * This constraint encourages a more balanced distribution of learning sessions over time.
	 *
	 * @param factory: The ConstraintFactory used to build the constraint.
	 * @return A soft constraint that penalizes uneven distribution of sessions until deadline.
	 */
	private Constraint encourageEvenDistributionUntilDeadline(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.groupBy(SessionForOptimizer::getTask,
						org.optaplanner.core.api.score.stream.ConstraintCollectors.toList())
				.penalize(HardSoftScore.ONE_SOFT,
						(task, sessionList) -> {
							// Filter out sessions without dates
							List<SessionForOptimizer> validSessions = sessionList.stream()
									.filter(s -> s.getDate() != null)
									.collect(Collectors.toList());

							if (validSessions.size() <= 1 || task.getDeadline() == null) {
								return 0; // No penalty for single sessions or tasks without deadline
							}

							// Sort sessions by date
							validSessions.sort((s1, s2) -> s1.getDate().compareTo(s2.getDate()));

							LocalDate startDate = LocalDate.now().plusDays(1);
							LocalDate deadline = task.getDeadline();

							long totalDaysAvailable = ChronoUnit.DAYS.between(startDate, deadline);

							if (totalDaysAvailable <= 0) {
								return 0; // No penalty if deadline is today or has passed
							}

							// Calculate ideal interval between sessions
							double idealInterval = (double) totalDaysAvailable / validSessions.size();

							// Minimum interval should be at least 1 day to avoid clustering
							double minInterval = Math.max(1.0, idealInterval * 0.5);

							int totalPenalty = 0;

							// Calculate penalties for deviation from ideal distribution
							for (int i = 0; i < validSessions.size(); i++) {
								SessionForOptimizer session = validSessions.get(i);

								// Calculate ideal date for this session (evenly distributed)
								double idealDayOffset = (i + 1) * idealInterval;
								LocalDate idealDate = startDate.plusDays((long) idealDayOffset);

								// Calculate deviation from ideal date
								long deviationDays = Math.abs(ChronoUnit.DAYS.between(idealDate, session.getDate()));

								// Penalize deviations more heavily for larger deviations
								if (deviationDays > 0) {
									totalPenalty += (int) Math.pow(deviationDays, 1.2);
								}
							}

							// Additional penalty for sessions that are too close together (clustering)
							for (int i = 0; i < validSessions.size() - 1; i++) {
								long daysBetween = ChronoUnit.DAYS.between(
										validSessions.get(i).getDate(),
										validSessions.get(i + 1).getDate()
								);

								// Penalize if sessions are too close together
								if (daysBetween < minInterval) {
									totalPenalty += (int) ((minInterval - daysBetween) * 3);
								}
							}

							return totalPenalty;
						})
				.asConstraint("Uneven distribution of sessions until deadline");
	}


}