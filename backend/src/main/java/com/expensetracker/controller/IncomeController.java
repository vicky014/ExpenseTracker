package com.expensetracker.controller;

import com.expensetracker.model.IncomeSource;
import com.expensetracker.repository.IncomeSourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    @Autowired
    private IncomeSourceRepository incomeSourceRepository;

    @GetMapping
    public List<IncomeSource> getIncomeSources(@RequestParam Long userId) {
        List<IncomeSource> sources = incomeSourceRepository.findByUserId(userId);
        if (sources.isEmpty() && userId == 1L) {
            // Seed default income sources for the demo user
            IncomeSource salary = new IncomeSource();
            salary.setUserId(1L);
            salary.setType("Salary");
            salary.setAmount(85000.0);
            salary.setFrequency("Monthly");
            salary.setIsConfirmed(true);
            incomeSourceRepository.save(salary);

            IncomeSource freelance = new IncomeSource();
            freelance.setUserId(1L);
            freelance.setType("Freelance");
            freelance.setAmount(15000.0);
            freelance.setFrequency("Monthly");
            freelance.setIsConfirmed(false);
            incomeSourceRepository.save(freelance);
            
            return incomeSourceRepository.findByUserId(1L);
        }
        return sources;
    }

    @PostMapping
    public IncomeSource saveIncomeSource(@RequestBody IncomeSource incomeSource) {
        return incomeSourceRepository.save(incomeSource);
    }

    @DeleteMapping("/{id}")
    public void deleteIncomeSource(@PathVariable Long id) {
        incomeSourceRepository.deleteById(id);
    }
}
