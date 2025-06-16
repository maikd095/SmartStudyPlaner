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

        // 1. Module als Tasks laden
        List<TaskForOptimizer> tasks = moduleRepository.findAllByUser_UserId(userId)
                .stream()
                .map(m -> new TaskForOptimizer(
                        m.getName(),
                        m.getHoursRequired(),
                        m.getDeadline(),
                        user.getPrefSessionLength() / 60.0, // Minuten → Stunden
                        user.getPrefBreakLength()
                ))
                .toList();

        System.out.println("Gefundene Module (Tasks): " + tasks.size());

        // 2. Events (feste) laden
        List<FixedEvent> fixedEvents = eventRepository.findAllByUser(user).stream()
                .filter(e -> e.getType().equals("fixed"))
                .map(e -> new FixedEvent(e.getStartDate(), e.getStartTime(), e.getEndTime()))
                .toList();

        System.out.println("Gefundene feste Events: " + fixedEvents.size());

        // 3. Zeit- und Datumsbereiche generieren
        List<LocalDate> dateRange = SmartPlannerMain.generateDateRange(tasks);
        List<LocalTime> timeRange = SmartPlannerMain.generateTimeRange();
        List<SessionForOptimizer> sessions = SmartPlannerMain.generateSessions(tasks);




        LearningSchedule schedule = new LearningSchedule(tasks, sessions);
        System.out.println("Generierte Sessions: " + schedule.getSessionList().size());
        schedule.setDateRange(dateRange);
        schedule.setTimeRange(timeRange);
        schedule.setFixedEventList(fixedEvents);

        Solver<LearningSchedule> solver = SmartPlannerMain.buildSolver();
        LearningSchedule solved = solver.solve(schedule);

        // 4. Als Events speichern
        List<Event> plannedEvents = solved.getSessionList().stream()
                .map(s -> {
                    Event e = new Event();
                    e.setTitle("Lernsession: " + s.getTask().getName());
                    e.setStartDate(s.getDate());
                    e.setEndDate(s.getDate());
                    e.setStartTime(s.getStartTime());
                    e.setEndTime(s.getEndTime());
                    e.setType("learning session");
                    e.setUser(user);
                    e.setIsFullDay(false);
                    return e;
                }).toList();



        eventRepository.saveAll(plannedEvents);
    }
}
