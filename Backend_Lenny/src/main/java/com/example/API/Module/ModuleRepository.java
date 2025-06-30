package com.example.API.Module;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * method to retrieve all Module records associated with a specific
 * user by their user ID.
 */
@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findAllByUser_UserId(Long userId);
}
