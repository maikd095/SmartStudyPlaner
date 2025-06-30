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

    /**
     * Deleting old learning sessions and generating a new learning plan for a user.
     *
     * @param userId userID from user
     * @return a ResponseEntity with an HTTP status indicating the result of the operation
     */
    @PostMapping("/user/{userId}")
    public ResponseEntity<Void> generateLearningPlan(@PathVariable Long userId) {
        System.out.println("userId = " + userId);
        planningService.deleteFutureLearningSessions(userId); // Step 1: delete old sessions
        planningService.planForUser(userId);
        return ResponseEntity.ok().build();
    }


}