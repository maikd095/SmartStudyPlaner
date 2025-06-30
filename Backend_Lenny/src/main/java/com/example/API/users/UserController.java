package com.example.API.users;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {


    private final UserService userService;
    private final UserRepository userRepository;


    @Autowired
    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     *  User login by verifying email & password provided in the login request
     *
     * @param loginRequest the login request object with the user's email and password
     * @return a ResponseEntity containing the login response if successful, or an unauthorized status with an error message if unsuccessful
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.login(loginRequest);

        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Wrong Email or Password. Please try again.");
        }
    }

    /**
     * Handles user registration by creating a new user in the database.
     * @param user user object with all the data
     * @return a ResponseEntity containing the registered user if successful, or a conflict status with an error message if unsuccessful.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        User registeredUser = userService.register(user);

        if (registeredUser != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("User with this email already exists. Please try again with a different email.");
        }
    }


    /**
     * GET-API: Returns all settings for a user
     * @param userId: userID of user for which settings should be returned.
     * @return If the user does not exist, a 404 status code is returned.
     */
    @GetMapping("/settings")
    public ResponseEntity<User> getAllSettingsForUser(@RequestParam Long userId) {
        return userRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * PUT-API: Updates the settings for a user
     * @param userInput User object containing the new settings
     * @return If the user does not exist, a 404 status code is returned
     */
    @PutMapping("/settings")
    public ResponseEntity<?> updateUserSettings(@RequestBody User userInput) {
        Optional<User> optionalUser = userRepository.findByUserId(userInput.getUserId());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();

        // update user settings if they are filled
        user.setFirstName(userInput.getFirstName());
        user.setLastName(userInput.getLastName());
        user.setPrefSessionLength(userInput.getPrefSessionLength());
        user.setPrefBreakLength(userInput.getPrefBreakLength());
        user.setPrefStartTime(userInput.getPrefStartTime());
        user.setPrefEndTime(userInput.getPrefEndTime());
        user.setEnableNotifications(userInput.getEnableNotifications());
        user.setDarkMode(userInput.getDarkMode());

        userRepository.save(user);
        return ResponseEntity.ok("Settings updated successfully");
    }
}