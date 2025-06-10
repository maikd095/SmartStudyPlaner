package com.example.API.Event;

import com.example.API.users.User;
import com.example.API.users.UserRepository;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.DtEnd;
import net.fortuna.ical4j.model.property.DtStart;
import net.fortuna.ical4j.model.property.Summary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.*;
import java.time.temporal.Temporal;
import java.util.Optional;

@Service
public class CalendarImportService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    public void importFromICS(MultipartFile file, Long userId) throws Exception {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) throw new Exception("User not found");

        User user = userOpt.get();
        InputStream stream = file.getInputStream();

        CalendarBuilder builder = new CalendarBuilder();
        Calendar calendar = builder.build(stream);

        for (Component component : calendar.getComponents(Component.VEVENT)) {
            VEvent vEvent = (VEvent) component;

            DtStart dtStart = (DtStart) vEvent.getProperty(Property.DTSTART).orElse(null);
            DtEnd dtEnd = (DtEnd) vEvent.getProperty(Property.DTEND).orElse(null);
            Summary summary = (Summary) vEvent.getProperty(Property.SUMMARY).orElse(null);

            if (dtStart == null || dtEnd == null) continue;

            // Neues Handling mit Temporal
            Temporal startTemporal = dtStart.getDate();
            Temporal endTemporal = dtEnd.getDate();

            boolean isFullDay = startTemporal instanceof LocalDate && !(startTemporal instanceof LocalDateTime);

            LocalDate startDate;
            LocalDate endDate;
            LocalTime startTime = null;
            LocalTime endTime = null;

            if (isFullDay) {
                //  Ganztagesevent am 12.06.
                startDate = (LocalDate) startTemporal;
                endDate = ((LocalDate) endTemporal).minusDays(1); // .ics DTEND ist exklusiv
            } else {
                ZonedDateTime startZdt = ZonedDateTime.of(LocalDateTime.from(startTemporal), ZoneId.systemDefault());
                ZonedDateTime endZdt = ZonedDateTime.of(LocalDateTime.from(endTemporal), ZoneId.systemDefault());

                startDate = startZdt.toLocalDate();
                endDate = endZdt.toLocalDate();
                startTime = startZdt.toLocalTime();
                endTime = endZdt.toLocalTime();
            }


            String title = summary != null ? summary.getValue() : "Untitled";

            System.out.println("📆 Importiere Event: " + title + " am " + startDate + " von " + startTime + " bis " + endTime);

            Event event = new Event();
            event.setTitle(title);
            event.setStartDate(startDate);
            event.setEndDate(endDate);
            event.setStartTime(startTime);
            event.setEndTime(endTime);
            event.setType("imported");
            event.setIsFullDay(isFullDay);
            event.setUser(user);

            eventRepository.save(event);
        }
    }
}
