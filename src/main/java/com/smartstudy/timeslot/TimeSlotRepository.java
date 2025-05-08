package com.smartstudy.timeslot;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Integer>{
	
	void deleteBySlotid (int slotid);
	Optional<TimeSlot> findBySlotid(int slotid);
	
}
