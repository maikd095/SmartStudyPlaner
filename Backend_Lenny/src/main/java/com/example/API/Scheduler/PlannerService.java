package com.example.API.Scheduler;

import com.example.API.Event.Event;
import com.example.API.Event.EventRepository;
import com.example.API.Module.ModuleRepository;
import com.example.API.users.User;
import com.example.API.users.UserRepository;
import org.optaplanner.core.api.solver.Solver;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class PlannerService {

    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    /**
     * Constructor for the PlannerService.
     * @param moduleRepository Repository for modules. Used to load modules as tasks.
     * @param userRepository Repository for users. Used to load the user's preferences.
     * @param eventRepository Repository for events. Used to load the user's fixed events.
     */
    public PlannerService(ModuleRepository moduleRepository,
                          UserRepository userRepository,
                          EventRepository eventRepository) {
        this.moduleRepository = moduleRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    /**
     * Plans learning sessions for a specified user based on their preferences, module progress,
     * and fixed events. The method retrieves the user's modules, calculates the remaining
     * hours required for each module, and considers fixed events to generate an optimized learning
     * schedule. The schedule respects the user's preferred study times, session lengths, and break lengths.
     * Once the schedule is optimized, it is saved as events for the user.
     *
     * @param userId userID of the user
     */
    public void planForUser(Long userId) {
        User user = userRepository.findByUserId(userId).orElseThrow();
        System.out.println("User-ID: " + userId);

        // load modules as tasks for the optimizer
        List<TaskForOptimizer> tasks = moduleRepository.findAllByUser_UserId(userId)
                .stream()
                .map(m -> {
                    // Calculate remaining hours (total required - already studied)
                    double remainingHours = m.getHoursRequired() - (m.getAlreadyStudied() != null ? m.getAlreadyStudied() : 0);

                    // If module is already completed
                    if (remainingHours <= 0) {
                        System.out.println("Module " + m.getName() + " is already completed. Skipping.");
                        return null;
                    }

                    System.out.println("Module " + m.getName() + ": " + remainingHours + " hours remaining (" +
                            m.getHoursRequired() + " total - " + (m.getAlreadyStudied() != null ? m.getAlreadyStudied() : 0) + " studied)");

                    // Create task for optimizer
                    return new TaskForOptimizer(
                            m.getName(),
                            remainingHours, // Use remaining hours instead of total hours
                            m.getDeadline(),
                            user.getPrefSessionLength() / 60.0, // convert minutes into hours
                            user.getPrefBreakLength() / 60.0     // convert minutes into hours
                    );
                })
                .filter(task -> task != null) // Remove null entries
                .toList();

        System.out.println("Found modules (Tasks): " + tasks.size());

        // If no tasks remain, exit early
        if (tasks.isEmpty()) {
            System.out.println("No modules with remaining hours found. No learning sessions to schedule.");
            return;
        }

        // Load the fixed events for the user
        List<FixedEvent> fixedEvents = eventRepository.findAllByUser(user).stream()
                .filter(e -> {
                    // filter out events with a type that is not a learning session
                    String type = e.getType();
                    return type == null || !type.equals("learning session");
                })
                .map(e -> {
                    // full day events: No learning sessions
                    if (e.getIsFullDay() != null && e.getIsFullDay()) {
                        return new FixedEvent(e.getStartDate(), LocalTime.of(0, 0), LocalTime.of(23, 59));
                    }
                    // normal events for fixed events
                    return new FixedEvent(e.getStartDate(), e.getStartTime(), e.getEndTime());
                })
                .toList();

        // Generate Time and date range
        List<LocalDate> dateRange = SmartPlannerMain.generateDateRange(tasks);
        List<LocalTime> timeRange = SmartPlannerMain.generateTimeRange(
                user.getPrefStartTime(),
                user.getPrefEndTime()
        );
        List<SessionForOptimizer> sessions = SmartPlannerMain.generateSessions(tasks);

        // Create schedule and set user preferences
        LearningSchedule schedule = new LearningSchedule(tasks, sessions);
        System.out.println("Generated sessions: " + schedule.getSessionList().size());
        schedule.setDateRange(dateRange);
        schedule.setTimeRange(timeRange);
        schedule.setFixedEventList(fixedEvents);

        // Set user preferences
        schedule.setUserPrefStudyStart(user.getPrefStartTime());
        schedule.setUserPrefStudyEnd(user.getPrefEndTime());
        schedule.setUserBreakLengthMinutes(user.getPrefBreakLength());

        // Print user preferences for debugging
        System.out.println("User preferences set:");
        System.out.println("- Study start: " + user.getPrefStartTime());
        System.out.println("- Study end: " + user.getPrefEndTime());
        System.out.println("- Break length: " + user.getPrefBreakLength() + " minutes");

        // Optimize schedule
        Solver<LearningSchedule> solver = SmartPlannerMain.buildSolver();
        LearningSchedule solved = solver.solve(schedule);

        // Print score for debugging
        System.out.println("Final score: " + solved.getScore());

        // Save as events in database
        List<Event> plannedEvents = solved.getSessionList().stream()
                .map(s -> {
                    Event e = new Event();
                    e.setTitle("Learning Session: " + s.getTask().getName());
                    e.setStartDate(s.getDate());
                    e.setEndDate(s.getDate());
                    e.setStartTime(s.getStartTime());
                    e.setEndTime(s.getEndTime());
                    e.setType("learning session");
                    e.setUser(user);
                    e.setIsFullDay(false);
                    return e;
                }).toList();

        System.out.println("Created " + plannedEvents.size() + " learning sessions");
        eventRepository.saveAll(plannedEvents);
    }

    /**
     * Deletes all future learning session events for a specific user.
     * Needed when clocking "rescheduling"
     *
     * @param userId userID of the user
     */
    public void deleteFutureLearningSessions(Long userId) {
        LocalDate today = LocalDate.now();
        System.out.println("Deleting future learning sessions for user " + userId + " after " + today);
        eventRepository.deleteAllByUserIdAndTypeAndStartDateAfter(userId, "learning session", today);
        System.out.println("Deletion completed");
    }
}