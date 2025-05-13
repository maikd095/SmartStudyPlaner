package com.example.API.users;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
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

    public LoginResponse login(LoginRequest loginRequest) {
        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                // Generiere ein einfaches Token (in der Praxis würde man hier JWT verwenden)
                String token = UUID.randomUUID().toString();

                return new LoginResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        token
                );
            }
        }

        return null; // Authentifizierung fehlgeschlagen
    }

    public User register(User user) {
        // Prüfe, ob E-Mail bereits existiert
        if (userRepository.existsByEmail(user.getEmail())) {
            return null; // Benutzer existiert bereits
        }

        // Passwort verschlüsseln
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Benutzer speichern
        return userRepository.save(user);
    }
}