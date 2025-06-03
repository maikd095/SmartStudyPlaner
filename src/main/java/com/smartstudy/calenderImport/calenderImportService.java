package com.smartstudy.calenderImport;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.Temporal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.smartstudy.timeslot.TimeSlot;

import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.component.VEvent;

@Service
public class calenderImportService {
	
	//Calender Import
	/////////////////////77 Still Testing and trying 
	public List<TimeSlot> parseICS(InputStream inputStream) throws Exception{
		List<TimeSlot> timeSlots = new ArrayList<>();
		
		CalendarBuilder builder = new CalendarBuilder();
		Calendar calendar = builder.build(inputStream);
		
		//Loop over all events in the ics file
		for (Component component : calendar.getComponents(Component.VEVENT)) {
			//VEvent used by ical4
			VEvent event = (VEvent) component;
			
			TimeSlot timeSlot = new TimeSlot();
					
			//Extraction of needed information from ics file events
			String name = event.getName();

			LocalDateTime slotStart = event.getStartDate().getDate().toInstant()
											.atZone(ZoneId.systemDefault()).toLocalDateTime();
			LocalDateTime slotEnd = event.getEndDate().getDate().toInstant()
					.atZone(ZoneId.systemDefault()).toLocalDateTime();
			
			//Editing timeSlot to add to List
			timeSlot.setSlotstart(slotStart);
			timeSlot.setSlotend(slotEnd);
			timeSlot.setName(name);
			timeSlot.setImported(true);
			
			
			timeSlots.add(timeSlot);
		}
		return timeSlots;
	}
	
}
