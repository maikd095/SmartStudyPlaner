package com.example.API.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;



@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // method to retrieve a user by their email address
    // (used for login)
    Optional<User> findByEmail(String email);

    // method to check if a user with a specific email address already exists
    // (used for registration)
    boolean existsByEmail(String email);

    // method to retrieve a user by their user ID
    // (used for updating user settings)
    Optional<User> findByUserId(Long id);

}