package com.smartstudy.timeslot;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.transaction.Transactional;

@Component
public class TimeSlotService {
	
	private final TimeSlotRepository timeSlotRep;

	@Autowired
	public TimeSlotService(TimeSlotRepository timeSlotRep) {
		this.timeSlotRep = timeSlotRep;
	}

	public List<TimeSlot> getAllTimeSlots(){
		return timeSlotRep.findAll();
	}
	
	public List<TimeSlot> getTimeSlotByName(String module){
		return timeSlotRep.findAll().stream()
				.filter(timeslot -> module.equals(timeslot.getName()))
				.collect(Collectors.toList());
	}
	
	public List<TimeSlot> getTimeSlotBySlotID(int slotid){
		return timeSlotRep.findAll().stream()
				.filter(timeslot -> timeslot.getSlotid() == slotid )
				.collect(Collectors.toList());
	}
	
	public List<TimeSlot> getTimeSlotByImported(boolean imported ){
		return timeSlotRep.findAll().stream()
				.filter(timeslot -> timeslot.getImported() == imported)
				.collect(Collectors.toList());
	}
	
	public TimeSlot addTimeSlot(TimeSlot timeslot) {
		timeSlotRep.save(timeslot);
		return timeslot;
	}
	
	@Transactional
	public void deleteTimeSlot(int slotid) {
		timeSlotRep.deleteBySlotid(slotid);
	}
	
	
}
