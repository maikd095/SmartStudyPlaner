package com.example.API.Event;

import com.example.API.Module.ModuleRepository;
import com.example.API.users.User;
import com.example.API.users.UserRepository;
import com.example.API.Module.Module;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final CalendarImportService calendarImportService;
    private final ModuleRepository moduleRepository;

    public EventController(EventRepository eventRepository,
                           UserRepository userRepository,
                           CalendarImportService calendarImportService,
                           ModuleRepository moduleRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.calendarImportService = calendarImportService;
        this.moduleRepository = moduleRepository;
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
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        // validate if a user is set
        if (event.getUser() == null || event.getUser().getUserId() == null) {
            return ResponseEntity.badRequest().body("User-ID is needed");
        }

        Optional<User> userOpt = userRepository.findById(event.getUser().getUserId());
        // set user from DB
        event.setUser(userOpt.get());

        try {
            Event savedEvent = eventRepository.save(event);
            return ResponseEntity.ok(savedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error while saving event: " + e.getMessage());
        }
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
    public ResponseEntity<Void> createLearningSessions(@RequestParam Event event){
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{eventId}")
    public ResponseEntity<?> updateEvent(@PathVariable Long eventId, @RequestBody Event eventInput) {
        // Prüfe, ob das Event existiert
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event existingEvent = optionalEvent.get();

        // Aktualisiere nur die Event-Felder
        if (eventInput.getTitle() != null) {
            existingEvent.setTitle(eventInput.getTitle());
        }

        if (eventInput.getType() != null) {
            existingEvent.setType(eventInput.getType());
        }

        if (eventInput.getStartDate() != null) {
            existingEvent.setStartDate(eventInput.getStartDate());
        }

        if (eventInput.getEndDate() != null) {
            existingEvent.setEndDate(eventInput.getEndDate());
        }

        if (eventInput.getStartTime() != null) {
            existingEvent.setStartTime(eventInput.getStartTime());
        }

        if (eventInput.getEndTime() != null) {
            existingEvent.setEndTime(eventInput.getEndTime());
        }

        if (eventInput.getIsFullDay() != null) {
            existingEvent.setIsFullDay(eventInput.getIsFullDay());
        }

        try {
            Event updatedEvent = eventRepository.save(existingEvent);
            return ResponseEntity.ok(updatedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Fehler beim Aktualisieren des Events: " + e.getMessage());
        }
    }

    @PutMapping("/{eventId}/completion")
    public ResponseEntity<?> updateSessionCompletion(@PathVariable Long eventId, @RequestParam Integer completed) {
        // Prüfe, ob das Event existiert
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event existingEvent = optionalEvent.get();

        // Validiere den completed Parameter (0 oder 1)
        if (completed != 0 && completed != 1) {
            return ResponseEntity.badRequest().body("Parameter 'completed' muss 0 oder 1 sein");
        }

        // Berechne die Session-Dauer in Stunden
        double sessionDurationHours = 0.0;
        if (existingEvent.getStartTime() != null && existingEvent.getEndTime() != null) {
            LocalTime startTime = existingEvent.getStartTime();
            LocalTime endTime = existingEvent.getEndTime();

            // Berechne Dauer in Minuten und konvertiere zu Stunden
            long durationMinutes = Duration.between(startTime, endTime).toMinutes();
            sessionDurationHours = durationMinutes / 60.0;
        }

        // Alte Session-Status für Rollback-Logik
        Integer oldSessionUsed = existingEvent.getSessionUsed();

        // Setze session_used auf 0 (nicht abgeschlossen) oder 1 (abgeschlossen)
        existingEvent.setSessionUsed(completed);

        try {
            // Speichere Event zuerst
            Event updatedEvent = eventRepository.save(existingEvent);

            // Aktualisiere das zugehörige Modul basierend auf dem Event-Titel
            updateModuleStudyTime(existingEvent.getTitle(), existingEvent.getUser().getUserId(),
                    completed, oldSessionUsed, sessionDurationHours);

            return ResponseEntity.ok(updatedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Fehler beim Aktualisieren der Session-Completion: " + e.getMessage());
        }
    }

    private void updateModuleStudyTime(String eventTitle, Long userId, Integer newStatus,
                                       Integer oldStatus, double sessionDurationHours) {
        // Finde Module basierend auf dem Event-Titel
        // Annahme: Event-Titel enthält den Modulnamen oder eine Referenz darauf
        List<Module> userModules = moduleRepository.findAllByUser_UserId(userId);

        // Finde das passende Modul (hier einfache Implementierung - Event-Titel muss Modul-Namen enthalten)
        Optional<Module> matchingModule = userModules.stream()
                .filter(module -> eventTitle.toLowerCase().contains(module.getName().toLowerCase()) ||
                        module.getName().toLowerCase().contains(eventTitle.toLowerCase()))
                .findFirst();

        if (matchingModule.isPresent()) {
            Module module = matchingModule.get();
            long currentStudyTime = module.getAlreadyStudied();

            // Berechne neue Studienzeit basierend auf Status-Änderung
            if (newStatus == 1 && (oldStatus == null || oldStatus == 0)) {
                // Session wurde als abgeschlossen markiert - Zeit hinzufügen
                module.setAlreadyStudied(currentStudyTime + Math.round(sessionDurationHours));
            } else if (newStatus == 0 && oldStatus == 1) {
                // Session wurde von abgeschlossen zu nicht-abgeschlossen geändert - Zeit abziehen
                long newStudyTime = Math.max(0, currentStudyTime - Math.round(sessionDurationHours));
                module.setAlreadyStudied(newStudyTime);
            }

            moduleRepository.save(module);
        }
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId) {
        // Prüfe, ob das Event existiert
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            eventRepository.deleteById(eventId);
            return ResponseEntity.ok().body("Event erfolgreich gelöscht");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Fehler beim Löschen des Events: " + e.getMessage());
        }
    }
}