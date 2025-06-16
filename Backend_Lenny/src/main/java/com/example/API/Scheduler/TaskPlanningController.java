package com.example.API.Scheduler;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/planning")
public class TaskPlanningController {

    private final PlannerService planningService;

    public TaskPlanningController(PlannerService planningService) {
        this.planningService = planningService;
    }

    @PostMapping("/user/{userId}")
    public ResponseEntity<Void> generateLearningPlan(@PathVariable Long userId) {
        System.out.println("CONTROLLER WIRD AUFGERUFEN: userId = " + userId);
        planningService.planForUser(userId);
        return ResponseEntity.ok().build();
    }
}
