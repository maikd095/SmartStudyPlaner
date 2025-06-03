package com.smartstudy.timeslot;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.smartstudy.calenderImport.calenderImportService;

@RestController
@RequestMapping(path = "/events")
public class TimeSlotController {
	private final TimeSlotService timeSlotService;
	private final calenderImportService calenderImportService;
	
	@Autowired
	public TimeSlotController(TimeSlotService timeSlotService, calenderImportService calenderImportService) {
		this.timeSlotService = timeSlotService;
		this.calenderImportService = calenderImportService;
	}
	
	@GetMapping
	public List<TimeSlot> getTimeSlots(
			@RequestParam(required = false) Integer slotid,
			@RequestParam(required = false) String name){
		if (slotid != null) {
			return timeSlotService.getTimeSlotBySlotID(slotid);
		} else if (name != null) {
			return timeSlotService.getTimeSlotByName(name);
		} else {
			return timeSlotService.getAllTimeSlots();
		}
	}
	
	@PostMapping
	public ResponseEntity<TimeSlot> addTimeSlot(@RequestBody TimeSlot timeslot) {
		TimeSlot timeslotcreated = timeSlotService.addTimeSlot(timeslot);
		return new ResponseEntity<>(timeslotcreated, HttpStatus.CREATED);
	}
	
	@DeleteMapping("/{slotid}")
	public ResponseEntity<String> deleteTimeSlot(@PathVariable int slotid) {
		timeSlotService.deleteTimeSlot(slotid);
		return new ResponseEntity<>("TimeSlot successfully deleted", HttpStatus.OK);
	}
	
	
	@PostMapping("/import")
	public ResponseEntity<String> importICS(@RequestParam("file") MultipartFile file) {
		
		try {	
			List<TimeSlot> timeSlots = calenderImportService.parseICS(file.getInputStream());
			return ResponseEntity.ok("Import worked, TimeSlots added: " + timeSlots.size());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Import Failed: " + e.getMessage());
		}
		
	}
	
}
