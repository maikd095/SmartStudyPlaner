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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.login(loginRequest);

        if (response != null) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Ungültige E-Mail oder Passwort");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        User registeredUser = userService.register(user);

        if (registeredUser != null) {
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } else {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Benutzer mit dieser E-Mail existiert bereits");
        }
    }

    @GetMapping("/settings")
    public ResponseEntity<User> getAllSettingsForUser(@RequestParam Long userId) {
        return userRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateUserSettings(@RequestBody User userInput) {
        Optional<User> optionalUser = userRepository.findByUserId(userInput.getUserId());

        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optionalUser.get();

        // Felder aktuaisieren
        user.setFirstName(userInput.getFirstName());
        user.setLastName(userInput.getLastName());
        user.setPrefSessionLength(userInput.getPrefSessionLength());
        user.setPrefBreakLength(userInput.getPrefBreakLength());
        user.setPrefStartTime(userInput.getPrefStartTime());
        user.setPrefEndTime(userInput.getPrefEndTime());
        user.setEnableNotifications(userInput.getEnableNotifications());
        user.setDarkMode(userInput.getDarkMode());

        userRepository.save(user);
        return ResponseEntity.ok("Settings geupdated");
    }
}