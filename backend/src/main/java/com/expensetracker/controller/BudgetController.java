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
        List<Budget> budgets = budgetRepository.findByUserId(userId);
        if (budgets.isEmpty() && userId == 1L) {
            // Seed a few default budgets for Vikram
            Budget b1 = new Budget();
            b1.setUserId(1L);
            b1.setCategory("Food & Dining");
            b1.setMonthlyLimit(10000.0);
            budgetRepository.save(b1);

            Budget b2 = new Budget();
            b2.setUserId(1L);
            b2.setCategory("Shopping");
            b2.setMonthlyLimit(8000.0);
            budgetRepository.save(b2);

            Budget b3 = new Budget();
            b3.setUserId(1L);
            b3.setCategory("Utilities & Bills");
            b3.setMonthlyLimit(6000.0);
            budgetRepository.save(b3);

            Budget b4 = new Budget();
            b4.setUserId(1L);
            b4.setCategory("Transport");
            b4.setMonthlyLimit(5000.0);
            budgetRepository.save(b4);
            
            return budgetRepository.findByUserId(1L);
        }
        return budgets;
    }

    @PostMapping
    public Budget saveBudget(@RequestBody Budget budget) {
        return budgetRepository.save(budget);
    }
}
