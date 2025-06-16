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
				minimizeSameTimeSlots(factory)
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
					if (session.getStartTime() == null) return false;
					return session.getStartTime().isBefore(event.getEndTime()) &&
							session.getEndTime().isAfter(event.getStartTime());
				})
				.penalize(HardSoftScore.ONE_HARD)
				.asConstraint("Session overlaps with fixed event");
	}
	//plan sessions for different times
	private Constraint encourageTimeDistribution(ConstraintFactory factory) {
		return factory.forEachUniquePair(SessionForOptimizer.class)
				.filter((a, b) -> {
					// Penalisiere wenn Sessions am gleichen Tag zur gleichen Zeit sind
					return a.getDate() != null && b.getDate() != null &&
							a.getStartTime() != null && b.getStartTime() != null &&
							a.getDate().equals(b.getDate()) &&
							a.getStartTime().equals(b.getStartTime());
				})
				.penalize(HardSoftScore.of(0, 100)) // Starke Soft-Penalisierung
				.asConstraint("Encourage time distribution");
	}
// minimises same time slot
	private Constraint minimizeSameTimeSlots(ConstraintFactory factory) {
		return factory.forEach(SessionForOptimizer.class)
				.groupBy(SessionForOptimizer::getStartTime,
						SessionForOptimizer::getDate,
						org.optaplanner.core.api.score.stream.ConstraintCollectors.count())
				.filter((time, date, count) -> count > 1)
				.penalize(HardSoftScore.of(0, 50),
						(time, date, count) -> count * count) // Quadratische Penalisierung
				.asConstraint("Minimize same time slots");
	}

}
