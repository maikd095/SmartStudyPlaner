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
        //If no userID is found, don't continue because we then can't fill the table
        if (userOpt.isEmpty()) throw new Exception("User not found");

        User user = userOpt.get();
        InputStream stream = file.getInputStream();

        CalendarBuilder builder = new CalendarBuilder();
        Calendar calendar = builder.build(stream);

        //Loop over all events in the ics file
        for (Component component : calendar.getComponents(Component.VEVENT)) {
            //VEvent used by ical4
            VEvent vEvent = (VEvent) component;


            //Extraction of needed information from ics file events
            DtStart dtStart = (DtStart) vEvent.getProperty(Property.DTSTART).orElse(null);
            DtEnd dtEnd = (DtEnd) vEvent.getProperty(Property.DTEND).orElse(null);
            Summary summary = (Summary) vEvent.getProperty(Property.SUMMARY).orElse(null);

            if (dtStart == null || dtEnd == null) continue;


            Temporal startTemporal = dtStart.getDate();
            Temporal endTemporal = dtEnd.getDate();

            boolean isFullDay = startTemporal instanceof LocalDate && !(startTemporal instanceof LocalDateTime);

            LocalDate startDate;
            LocalDate endDate;
            LocalTime startTime = null;
            LocalTime endTime = null;

            if (isFullDay) {
                //  Full day event
                startDate = (LocalDate) startTemporal;
                // .ics DTEND is exclusive
                endDate = ((LocalDate) endTemporal).minusDays(1);
            } else {
                ZonedDateTime startZdt = ZonedDateTime.of(LocalDateTime.from(startTemporal), ZoneId.systemDefault());
                ZonedDateTime endZdt = ZonedDateTime.of(LocalDateTime.from(endTemporal), ZoneId.systemDefault());

                startDate = startZdt.toLocalDate();
                endDate = endZdt.toLocalDate();
                startTime = startZdt.toLocalTime();
                endTime = endZdt.toLocalTime();
            }


            String title = summary != null ? summary.getValue() : "Untitled";

            System.out.println("Imported Event: " + title + " on " + startDate + " from " + startTime + " to " + endTime);

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
