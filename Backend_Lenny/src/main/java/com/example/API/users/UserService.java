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
                // generating token
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

        return null; // authentification failed
    }

    public User register(User user) {
        // checking if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            return null; // user already exists
        }

        // encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // saving user
        return userRepository.save(user);
    }
}