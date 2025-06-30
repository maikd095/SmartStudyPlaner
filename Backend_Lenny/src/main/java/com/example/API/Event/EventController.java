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

    /**
     * Get-API to get all events for a user
     * @param userId: ID of user for which events should be returned.
     * @return ResponseEntity containing a list of events or an error message if the query failed
     */
    @GetMapping
    public ResponseEntity<List<Event>> getEventsForUser(@RequestParam Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<Event> events = eventRepository.findAllByUser(user.get());
        return ResponseEntity.ok(events);
    }

    /**
     * POST-API to get a single event by its ID (INSERT into table)
     * @param event: Event to be inserted into the database
     * @return ResponseEntity containing inserted event or an error message if the insertion failed.
     */
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

    /**
     * Imports a calendar file in .ICS to insert Events
     *
     * @param file: the calendar file to be imported
     * @param userId: the userID to import the events for the specicifed  user
     * @return a ResponseEntity containing a success message if the import is successful,
     *         or an error message if the import fails
     */
    @PostMapping("/import")
    public ResponseEntity<String> importCalendar(@RequestParam("file") MultipartFile file,
                                                 @RequestParam("userId") Long userId) {
        try {
            calendarImportService.importFromICS(file, userId);
            return ResponseEntity.ok("Import successful!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Import fehlgeschlagen: " + e.getMessage());
        }
    }

    /**
     * UPDATE-API: Updates an already existing event
     *
     * @param eventId: eventID for the updated event
     * @param eventInput:  new event data
     * @return ResponseEntity containing the updated event if successful, a 404 status code
     *         if the event does not exist, or a 500 status code if an error occurs during the update
     */
    @PutMapping("/{eventId}")
    public ResponseEntity<?> updateEvent(@PathVariable Long eventId, @RequestBody Event eventInput) {
        // Check if event with given ID exists
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event existingEvent = optionalEvent.get();

        // update event fields if they are filled
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
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Completion-API: Marks an event as completed
     *
     * @param eventId: ID of the event that was completed
     * @return ResponseEntity containing a success message if the completion is successful,
     *         or a 404 status code if the event does not exist, or a 500 status code if an error occurs during the deletion
     */
    @PutMapping("/{eventId}/completion")
    public ResponseEntity<?> updateSessionCompletion(@PathVariable Long eventId, @RequestParam Integer completed) {
        // Check if event with passed ID exists
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event existingEvent = optionalEvent.get();

        // validate parameter 'completed'
        if (completed != 0 && completed != 1) {
            return ResponseEntity.badRequest().body("Parameter 'completed' must be 0 or 1");
        }

        // calculate duration of session
        double sessionDurationHours = 0.0;
        if (existingEvent.getStartTime() != null && existingEvent.getEndTime() != null) {
            LocalTime startTime = existingEvent.getStartTime();
            LocalTime endTime = existingEvent.getEndTime();

            // calculate duration in minutes
            long durationMinutes = Duration.between(startTime, endTime).toMinutes();
            sessionDurationHours = durationMinutes / 60.0;
        }

        // old session_used value (needed to update the study time of the module)
        Integer oldSessionUsed = existingEvent.getSessionUsed();

        // set session_used value
        existingEvent.setSessionUsed(completed);

        try {
            // save event in database
            Event updatedEvent = eventRepository.save(existingEvent);

            // update module study time if necessary
            updateModuleStudyTime(existingEvent.getTitle(), existingEvent.getUser().getUserId(),
                    completed, oldSessionUsed, sessionDurationHours);

            return ResponseEntity.ok(updatedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error:" + e.getMessage());
        }
    }

    /**
     * Updates the study time for a  module
     *
     *
     *
     * @param eventTitle            The title of the event
     * @param userId                The userID of the user
     * @param newStatus             The new status of the session (completed (1) or not completed (0)).
     * @param oldStatus             The previous status of the session before the update
     * @param sessionDurationHours  The duration of the session
     */
    private void updateModuleStudyTime(String eventTitle, Long userId, Integer newStatus,
                                       Integer oldStatus, double sessionDurationHours) {
        // find modules based on user id
        List<Module> userModules = moduleRepository.findAllByUser_UserId(userId);

        // find coresponding module based on the event title. In this case, the event title is the name of the module.
        // In a completely normalized database this should be done by an n:m-table with the event_ids to module_ids.
        // Due to late implementation this wasn't done.
        Optional<Module> matchingModule = userModules.stream()
                .filter(module -> eventTitle.toLowerCase().contains(module.getName().toLowerCase()) ||
                        module.getName().toLowerCase().contains(eventTitle.toLowerCase()))
                .findFirst();

        if (matchingModule.isPresent()) {
            Module module = matchingModule.get();
            long currentStudyTime = module.getAlreadyStudied();

            // calculate new study time based on the new status and the current study time
            if (newStatus == 1 && (oldStatus == null || oldStatus == 0)) {
                // session marked as completed for the first time - add session duration to study time
                module.setAlreadyStudied(currentStudyTime + Math.round(sessionDurationHours));
            } else if (newStatus == 0 && oldStatus == 1) {
                // ssession marked as not completed - subtract session duration from study time
                long newStudyTime = Math.max(0, currentStudyTime - Math.round(sessionDurationHours));
                module.setAlreadyStudied(newStudyTime);
            }

            moduleRepository.save(module);
        }
    }

    /**
     * DELETE-API: Deletes an event by ID
     *
     * @param eventId: ID of the event to be deleted
     * @return ResponseEntity containing a success message if the deletion is successful,
     *         or a 404 status code if the event does not exist, or a 500 status code if an error occurs during the deletion
     */
    @DeleteMapping("/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId) {
        // check if event with passed ID exists
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            eventRepository.deleteById(eventId);
            return ResponseEntity.ok().body("Event deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}