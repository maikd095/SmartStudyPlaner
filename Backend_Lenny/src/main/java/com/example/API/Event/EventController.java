package com.example.API.Event;

import com.example.API.users.User;
import com.example.API.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {


    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final CalendarImportService calendarImportService;

    public EventController(EventRepository eventRepository,
                           UserRepository userRepository,
                           CalendarImportService calendarImportService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.calendarImportService = calendarImportService;
    }

    @GetMapping
    public ResponseEntity<List<Event>> getEventsForUser(@RequestParam Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<Event> events = eventRepository.findAllByUser(user.get());
        return ResponseEntity.ok(events);
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.ok(savedEvent);
    }

    @PostMapping("/import")
    public ResponseEntity<String> importCalendar(@RequestParam("file") MultipartFile file,
                                                 @RequestParam("userId") Long userId) {
        try {
            calendarImportService.importFromICS(file, userId);
            return ResponseEntity.ok("Import erfolgreich");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Import fehlgeschlagen: " + e.getMessage());
        }
    }

    @PostMapping("/learningScheduler")
    public int createLearningSessions(@RequestParam Event event){
        return 0;
    }



}