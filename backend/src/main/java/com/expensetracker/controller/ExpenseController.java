package com.expensetracker.controller;

import com.expensetracker.model.Expense;
import com.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseRepository expenseRepository;

    @GetMapping
    public List<Expense> getExpenses(@RequestParam Long userId) {
        List<Expense> expenses = expenseRepository.findByUserId(userId);
        if (expenses.isEmpty() && userId == 1L) {
            // Seed a few demo expenses for Vikram
            LocalDate today = LocalDate.now();
            
            Expense e1 = new Expense();
            e1.setUserId(1L);
            e1.setAmount(1200.0);
            e1.setCategory("Food & Dining");
            e1.setNote("Dinner with family");
            e1.setDate(today.minusDays(1));
            expenseRepository.save(e1);

            Expense e2 = new Expense();
            e2.setUserId(1L);
            e2.setAmount(3500.0);
            e2.setCategory("Shopping");
            e2.setNote("Bought jacket");
            e2.setDate(today.minusDays(2));
            expenseRepository.save(e2);

            Expense e3 = new Expense();
            e3.setUserId(1L);
            e3.setAmount(450.0);
            e3.setCategory("Transport");
            e3.setNote("Uber ride to office");
            e3.setDate(today);
            expenseRepository.save(e3);

            Expense e4 = new Expense();
            e4.setUserId(1L);
            e4.setAmount(2000.0);
            e4.setCategory("Utilities & Bills");
            e4.setNote("Electricity Bill");
            e4.setDate(today.minusDays(4));
            expenseRepository.save(e4);
            
            return expenseRepository.findByUserId(1L);
        }
        return expenses;
    }

    @PostMapping
    public Expense saveExpense(@RequestBody Expense expense) {
        if (expense.getDate() == null) {
            expense.setDate(LocalDate.now());
        }
        return expenseRepository.save(expense);
    }

    @DeleteMapping("/{id}")
    public void deleteExpense(@PathVariable Long id) {
        expenseRepository.deleteById(id);
    }
}
