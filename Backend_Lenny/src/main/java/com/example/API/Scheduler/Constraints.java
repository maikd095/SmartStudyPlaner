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
	        //avoidLateSessions(factory)
	            // Add more constraints here
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
	                return daysLate > 0 ? (int) daysLate : 0;
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
}
