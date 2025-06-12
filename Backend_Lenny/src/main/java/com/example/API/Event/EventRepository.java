package com.example.API.Event;

import com.example.API.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findAllByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    // Methode zum Finden von Events nach Benutzer
    List<Event> findAllByUser(User user);
    
    // Optional: Methode mit Zeitraum und Benutzer kombinieren
    List<Event> findAllByUserAndStartTimeBetween(User user, LocalDateTime start, LocalDateTime end);
}