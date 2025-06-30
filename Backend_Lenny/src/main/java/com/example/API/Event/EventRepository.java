package com.example.API.Event;

import com.example.API.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {

    // method to find all events for a specific user
    List<Event> findAllByUser(User user);

    /**
     * USES FOR RESCHEDULING EVENTS
     * Deletes all events associated with the specified user ID, event type,
     * and a start date after the provided date.
     *
     * @param userId the ID of the user whose events are to be deleted
     * @param type the type of the events to be deleted
     * @param startDate the date after which events will be deleted
     */
    @Transactional
    @Modifying
    @Query("DELETE FROM Event e WHERE e.user.id = :userId AND e.type = :type AND e.startDate > :startDate")
    void deleteAllByUserIdAndTypeAndStartDateAfter(@Param("userId") Long userId,
                                                   @Param("type") String type,
                                                   @Param("startDate") LocalDate startDate);

}