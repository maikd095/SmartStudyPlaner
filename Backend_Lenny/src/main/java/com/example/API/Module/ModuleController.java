package com.example.API.Module;

import com.example.API.users.User;
import com.example.API.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/module")
@CrossOrigin(origins = "*")
public class ModuleController {

    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;

    public ModuleController(UserRepository userRepository, ModuleRepository moduleRepository) {
        this.userRepository = userRepository;
        this.moduleRepository = moduleRepository;
    }

    @PostMapping
    public ResponseEntity<?> createModule(@RequestBody Module module){
        // validate if a user is set
        if (module.getUser() == null || module.getUser().getUserId() == null) {
            return ResponseEntity.badRequest().body("User-ID is needed");
        }

        // Check if user exists
        Optional<User> userOpt = userRepository.findById(module.getUser().getUserId());
        if (!userOpt.isPresent()) {
            return ResponseEntity.badRequest().body("User with ID " + module.getUser().getUserId() + " not found");
        }
        // set user from DB
        module.setUser(userOpt.get());

        try {
            Module savedModule = moduleRepository.save(module);
            return ResponseEntity.ok(savedModule);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error while saving module: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Module>> getModulesForUser(@RequestParam Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<Module> modules = moduleRepository.findAllByUser_UserId(userId);
        return ResponseEntity.ok(modules);
    }

    @PutMapping("/{moduleId}")
    public ResponseEntity<?> updateModule(@PathVariable Long moduleId, @RequestBody Module moduleInput) {
        // Check if module exists
        Optional<Module> moduleOpt = moduleRepository.findById(moduleId);
        if (!moduleOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Module existingModule = moduleOpt.get();

        // Validate user if provided in input
        if (moduleInput.getUser() != null && moduleInput.getUser().getUserId() != null) {
            Optional<User> userOpt = userRepository.findById(moduleInput.getUser().getUserId());
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body("User with ID " + moduleInput.getUser().getUserId() + " not found");
            }
            existingModule.setUser(userOpt.get());
        }

        // Update fields if they are provided (not null)
        if (moduleInput.getName() != null) {
            existingModule.setName(moduleInput.getName());
        }

        if (moduleInput.getHoursRequired() > 0) {
            existingModule.setHoursRequired(moduleInput.getHoursRequired());
        }

        if (moduleInput.getDeadline() != null) {
            existingModule.setDeadline(moduleInput.getDeadline());
        }

        if (moduleInput.getEcts() != null) {
            existingModule.setEcts(moduleInput.getEcts());
        }

        if (moduleInput.getAlreadyStudied() != null) {
            existingModule.setAlreadyStudied(moduleInput.getAlreadyStudied());
        }

        if (moduleInput.getDifficulty() != null) {
            existingModule.setDifficulty(moduleInput.getDifficulty());
        }

        try {
            moduleRepository.save(existingModule);

            // Return success message instead of the module object to avoid serialization issues
            return ResponseEntity.ok().body("Module updated successfully");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error while updating module: " + e.getMessage());
        }
    }
}