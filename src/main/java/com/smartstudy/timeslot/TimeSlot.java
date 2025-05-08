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
	
	private String module;
	
	private boolean available;
	
	
	public TimeSlot(int slotid, LocalDateTime slotstart, LocalDateTime slotend, String module, boolean available) {
		
		this.slotid = slotid;
		this.slotstart = slotstart;
		this.slotend = slotend;
		this.module = module;
		this.available = available;
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


	public String getModule() {
		return module;
	}


	public void setModule(String module) {
		this.module = module;
	}


	public boolean isAvailable() {
		return available;
	}


	public void setAvailable(boolean available) {
		this.available = available;
	}
	
	
}
