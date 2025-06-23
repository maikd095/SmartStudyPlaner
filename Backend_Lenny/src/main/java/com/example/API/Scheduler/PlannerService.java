package com.example.API.Scheduler;

import com.example.API.Event.Event;
import com.example.API.Event.EventRepository;
import com.example.API.Module.ModuleRepository;
import com.example.API.users.User;
import com.example.API.users.UserRepository;
import org.optaplanner.core.api.solver.Solver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class PlannerService {

    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public PlannerService(ModuleRepository moduleRepository,
                          UserRepository userRepository,
                          EventRepository eventRepository) {
        this.moduleRepository = moduleRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    public void planForUser(Long userId) {
        User user = userRepository.findByUserId(userId).orElseThrow();
        System.out.println("User-ID: " + userId);

        // Load modules as tasks - FIXED: Calculate remaining hours
        List<TaskForOptimizer> tasks = moduleRepository.findAllByUser_UserId(userId)
                .stream()
                .map(m -> {
                    // Calculate remaining hours (total required - already studied)
                    double remainingHours = m.getHoursRequired() - (m.getAlreadyStudied() != null ? m.getAlreadyStudied() : 0);

                    // Skip modules that are already completed
                    if (remainingHours <= 0) {
                        System.out.println("Module " + m.getName() + " is already completed. Skipping.");
                        return null;
                    }

                    System.out.println("Module " + m.getName() + ": " + remainingHours + " hours remaining (" +
                            m.getHoursRequired() + " total - " + (m.getAlreadyStudied() != null ? m.getAlreadyStudied() : 0) + " studied)");

                    return new TaskForOptimizer(
                            m.getName(),
                            remainingHours, // Use remaining hours instead of total hours
                            m.getDeadline(),
                            user.getPrefSessionLength() / 60.0, // convert minutes into hours
                            user.getPrefBreakLength() / 60.0     // convert minutes into hours
                    );
                })
                .filter(task -> task != null) // Remove null entries (completed modules)
                .toList();

        System.out.println("Found modules (Tasks): " + tasks.size());

        // If no tasks remain, exit early
        if (tasks.isEmpty()) {
            System.out.println("No modules with remaining hours found. No learning sessions to schedule.");
            return;
        }

        // Load the fixed events for the user
        List<FixedEvent> fixedEvents = eventRepository.findAllByUser(user).stream()
                .filter(e -> !e.getType().equals("learning session")) // Get everything besides already scheduled learning sessions
                .map(e -> {
                    // full day events: No learning sessions
                    if (e.getIsFullDay() != null && e.getIsFullDay()) {
                        return new FixedEvent(e.getStartDate(), LocalTime.of(0, 0), LocalTime.of(23, 59));
                    }
                    // Normal Events with start and end time
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

        // NEU: Benutzereinstellungen setzen
        schedule.setUserPrefStudyStart(user.getPrefStartTime());
        schedule.setUserPrefStudyEnd(user.getPrefEndTime());
        schedule.setUserBreakLengthMinutes(user.getPrefBreakLength());

        System.out.println("User preferences set:");
        System.out.println("- Study start: " + user.getPrefStartTime());
        System.out.println("- Study end: " + user.getPrefEndTime());
        System.out.println("- Break length: " + user.getPrefBreakLength() + " minutes");

        Solver<LearningSchedule> solver = SmartPlannerMain.buildSolver();
        LearningSchedule solved = solver.solve(schedule);

        System.out.println("Final score: " + solved.getScore());

        // Save as events
        List<Event> plannedEvents = solved.getSessionList().stream()
                .map(s -> {
                    Event e = new Event();
                    e.setTitle("Lernsession: " + s.getTask().getName());
                    e.setStartDate(s.getDate());
                    e.setEndDate(s.getDate());
                    e.setStartTime(s.getStartTime());
                    e.setEndTime(s.getEndTime());
                    e.setType("learning session"); // KONSISTENT mit dem Typ der gelöscht wird
                    e.setUser(user);
                    e.setIsFullDay(false);
                    return e;
                }).toList();

        System.out.println("Created " + plannedEvents.size() + " learning sessions");
        eventRepository.saveAll(plannedEvents);
    }

    // KORRIGIERT: Lösche Events mit dem gleichen Typ wie sie gespeichert werden
    public void deleteFutureLearningSessions(Long userId) {
        LocalDate today = LocalDate.now();
        System.out.println("Deleting future learning sessions for user " + userId + " after " + today);
        eventRepository.deleteAllByUserIdAndTypeAndStartDateAfter(userId, "learning session", today);
        System.out.println("Deletion completed");
    }
}