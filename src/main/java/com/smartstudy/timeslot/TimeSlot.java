package com.smartstudy.timeslot;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="time_slots")
public class TimeSlot {
	
	@Id
	@Column(name = "slotid", unique =true)
	private int slotid;	
	
	private LocalDateTime slotstart;
	
	private LocalDateTime slotend;
	
	private String name;
	
	private boolean imported;
	
	private boolean sessionUsed;
	
	
	public TimeSlot(int slotid, LocalDateTime slotstart, LocalDateTime slotend, String name, boolean imported, boolean sessionUsed) {
		
		this.slotid = slotid;
		this.slotstart = slotstart;
		this.slotend = slotend;
		this.name = name;
		this.imported = imported;
		this.sessionUsed = sessionUsed;
	}

	public TimeSlot() {
		// TODO Auto-generated constructor stub
	}
	
	public int getSlotid() {
		return slotid;
	}


	public void setSlotid(int slotid) {
		this.slotid = slotid;
	}


	public LocalDateTime getSlotstart() {
		return slotstart;
	}


	public void setSlotstart(LocalDateTime slotstart) {
		this.slotstart = slotstart;
	}


	public LocalDateTime getSlotend() {
		return slotend;
	}


	public void setSlotend(LocalDateTime slotend) {
		this.slotend = slotend;
	}


	public String getName() {
		return name;
	}


	public void setName(String name) {
		this.name = name;
	}


	public boolean getImported() {
		return imported;
	}


	public void setImported(boolean imported) {
		this.imported = imported;
	}
	
	public boolean getSessionUsed() {
		return sessionUsed;
	}

	public void setSessionUsed(boolean sessionUsed) {
		this.sessionUsed = sessionUsed;
	}
	
	
}
