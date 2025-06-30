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

    // constructor
    public ModuleController(UserRepository userRepository, ModuleRepository moduleRepository) {
        this.userRepository = userRepository;
        this.moduleRepository = moduleRepository;
    }

    /**
     * INSERT-API: Creates a new module for a user
     * Validates that the user exists and saves the new module to the repository.
     *
     * @param module the Module object containing module details to be created.
     *               The module must have a valid user object with a userId set.
     * @return a ResponseEntity containing:
     *         - HTTP status 200 and the created module if successful
     *         - HTTP status 400 with an error message if the user is not provided or does not exist
     *         - HTTP status 500 with an error message if an unexpected error occurs during processing
     */
    @PostMapping
    public ResponseEntity<?> createModule(@RequestBody Module module){
        // validate if a user is set
        if (module.getUser() == null || module.getUser().getUserId() == null) {
            return ResponseEntity.badRequest().body("User-ID is needed");
        }

        // checks if user exists
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

    /**
     * GET-API: Returns all modules for a user
     * @param userId: userID of user for which modules should be returned.
     * @return: ResponseEntity containing a list of modules or an error message if the query failed
     */
    @GetMapping
    public ResponseEntity<List<Module>> getModulesForUser(@RequestParam Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<Module> modules = moduleRepository.findAllByUser_UserId(userId);
        return ResponseEntity.ok(modules);
    }

    /**
     * UPDATE-API: Updates an existing module
     * @param moduleId: ID of the module to be updated.
     * @param moduleInput: Module object containing the new module data.
     * @return: ResponseEntity containing the updated module if successful
     */
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


            return ResponseEntity.ok().body("Module updated successfully");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error while updating module: " + e.getMessage());
        }
    }
}