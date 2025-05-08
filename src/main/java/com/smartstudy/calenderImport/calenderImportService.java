package com.smartstudy.calenderImport;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.smartstudy.timeslot.TimeSlot;

import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.DtStart;

@Service
public class calenderImportService {
	
	@SuppressWarnings("deprecation")
	public List<TimeSlot> parseICS(InputStream inputStream) throws Exception{
		List<TimeSlot> timeSlots = new ArrayList<>();
		
		CalendarBuilder builder = new CalendarBuilder();
		net.fortuna.ical4j.model.Calendar calendar = builder.build(inputStream);
		
		for (Component component : calendar.getComponents(Component.VEVENT)) {
			VEvent event = (VEvent) component;
			
			TimeSlot timeSlot = new TimeSlot();
			
			// Getting the Dates from the Calendar appointments
			Optional<Property> dtStart = event.getProperty(Property.DTSTART);
			Optional<Property> dtEnd = event.getProperty(Property.DTEND);
			
			// this handles possible problems with Timezones
			
			
			timeSlot.setSlotstart(null);
			timeSlot.setSlotend(null);
			timeSlot.setModule(null);
			timeSlot.setAvailable(false);
			
			timeSlots.add(timeSlot);
		}
		
		return timeSlots;
	}
	
}
