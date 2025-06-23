package com.example.API.Scheduler;

import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import static org.optaplanner.core.api.score.stream.Joiners.equal;
//import java.time.LocalDate;
import java.time.LocalTime;

public class Constraints implements ConstraintProvider {
	@Override
	public Constraint[] defineConstraints(ConstraintFactory factory) {
		return new Constraint[] {
				noOverlappingSessions(factory),
				prioritizeEarlyDeadlines(factory),
				avoidFixedEventOverlap(factory),
				encourageTimeDistribution(factory),
				minimizeSameTimeSlots(factory),
				enforceBreakBetweenSessions(factory),
				respectUserPreferredHours(factory)
				//for more constraints
		};
	}

	//no overlapping sessions
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

	//sessions past deadline penalize (not hard score so that it always has a solution)
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

	//no fixed events overlaps
	private Constraint avoidFixedEventOverlap(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.join(FixedEvent.class,
						equal(SessionForOptimizer::getDate, FixedEvent::getDate))
				.filter((session, event) -> {
					if (session.getStartTime() == null || session.getEndTime() == null)
						return false;
					if (event.getStartTime() == null || event.getEndTime() == null)
						return false;

					// Überlappung prüfen: Session startet vor Event-Ende UND Session endet nach Event-Start
					return session.getStartTime().isBefore(event.getEndTime()) &&
							session.getEndTime().isAfter(event.getStartTime());
				})
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("Session overlaps with fixed event");
	}
	//plan sessions for different times - HARD CONSTRAINT
	private Constraint encourageTimeDistribution(ConstraintFactory factory) {
		return factory.forEachUniquePair(SessionForOptimizer.class)
				.filter((a, b) -> {
					// Verhindere Sessions am gleichen Tag zur gleichen Zeit
					return a.getDate() != null && b.getDate() != null &&
							a.getStartTime() != null && b.getStartTime() != null &&
							a.getDate().equals(b.getDate()) &&
							a.getStartTime().equals(b.getStartTime());
				})
				.penalize(HardSoftScore.ONE_HARD) // ← HART statt Soft!
				.asConstraint("No simultaneous sessions");
	}
	// minimises same time slot - HARD CONSTRAINT
	private Constraint minimizeSameTimeSlots(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.groupBy(SessionForOptimizer::getStartTime,
						SessionForOptimizer::getDate,
						org.optaplanner.core.api.score.stream.ConstraintCollectors.count())
				.filter((time, date, count) -> count > 1)
				.penalize(HardSoftScore.ONE_HARD) // ← HART statt Soft!
				.asConstraint("No sessions at same time slot");
	}

	// FIXED: Enforce break between sessions - using problem facts instead of planning solution
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

					// Prüfe ob eine Session direkt nach der anderen kommt (ohne Pause)
					LocalTime endA = sessionA.getEndTime();
					LocalTime startB = sessionB.getStartTime();
					LocalTime endB = sessionB.getEndTime();
					LocalTime startA = sessionA.getStartTime();

					// Session A endet, Session B startet - brauchen Pause dazwischen
					boolean needsBreakAtoB = endA.equals(startB) ||
							(endA.isBefore(startB) && endA.plusMinutes(breakMinutes).isAfter(startB));

					// Session B endet, Session A startet - brauchen Pause dazwischen
					boolean needsBreakBtoA = endB.equals(startA) ||
							(endB.isBefore(startA) && endB.plusMinutes(breakMinutes).isAfter(startA));

					return needsBreakAtoB || needsBreakBtoA;
				})
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("Insufficient break between sessions");
	}

	// FIXED: Respect user preferred study hours - using problem facts instead of planning solution
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

					// Session liegt außerhalb der bevorzugten Zeiten
					boolean startsBeforePreferred = sessionStart.isBefore(prefStart);
					boolean endsAfterPreferred = sessionEnd.isAfter(prefEnd);

					return startsBeforePreferred || endsAfterPreferred;
				})
				.penalize(HardSoftScore.ONE_SOFT) // Moderate Penalisierung
				.asConstraint("Session outside preferred hours");
	}
}