package com.example.API.users;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Handles user login by checking if the provided email and password match eith DB
     * @param loginRequest the login request object with the user's email and password
     * @return a LoginResponse object with data
     */
    public LoginResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                // generate a token for user
                String token = UUID.randomUUID().toString();

                return new LoginResponse(
                        user.getUserId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        token
                );
            }
        }

        return null; // no user found or password does not match
    }

    /**
     * Handles user registration by checking if the provided email already exists in the DB.
     * @param user the user object with all the data
     * @return a User object with data if successful, or null if unsuccessful.
     */
    public User register(User user) {
        // check if user exists in DB
        if (userRepository.existsByEmail(user.getEmail())) {
            return null; // user already exists
        }

        // encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // set creation date to current datetime
        user.setCreationDate(LocalDateTime.now());

        // set default preference times if not provided
        if (user.getPrefStartTime() == null) {
            user.setPrefStartTime(LocalTime.of(10, 0, 0)); // 10:00:00
        }

        if (user.getPrefEndTime() == null) {
            user.setPrefEndTime(LocalTime.of(22, 0, 0)); // 22:00:00
        }

        // save user to DB
        return userRepository.save(user);
    }
}