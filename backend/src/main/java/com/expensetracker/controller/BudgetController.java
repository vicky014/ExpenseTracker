package com.expensetracker.controller;

import com.expensetracker.model.Budget;
import com.expensetracker.repository.BudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    @Autowired
    private BudgetRepository budgetRepository;

    @GetMapping
    public List<Budget> getBudgets(@RequestParam Long userId) {
        return budgetRepository.findByUserId(userId);
    }

    @PostMapping
    public Budget saveBudget(@RequestBody Budget budget) {
        return budgetRepository.save(budget);
    }
}
