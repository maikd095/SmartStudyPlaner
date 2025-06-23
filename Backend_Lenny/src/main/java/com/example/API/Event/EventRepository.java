package com.example.API.Event;

import com.example.API.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    // Methode zum Finden von Events nach Benutzer
    List<Event> findAllByUser(User user);
    
    // Optional: Methode mit Zeitraum und Benutzer kombinieren
    List<Event> findAllByUserAndStartTimeBetween(User user, LocalDateTime start, LocalDateTime end);

    @Transactional
    @Modifying
    @Query("DELETE FROM Event e WHERE e.user.id = :userId AND e.type = :type AND e.startDate > :startDate")
    void deleteAllByUserIdAndTypeAndStartDateAfter(@Param("userId") Long userId,
                                                   @Param("type") String type,
                                                   @Param("startDate") LocalDate startDate);

}