package com.expensetracker.controller;

import com.expensetracker.model.IncomeSource;
import com.expensetracker.repository.IncomeSourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/income")
public class IncomeController {

    @Autowired
    private IncomeSourceRepository incomeSourceRepository;

    @GetMapping
    public List<IncomeSource> getIncomeSources(@RequestParam Long userId) {
        return incomeSourceRepository.findByUserId(userId);
    }

    @PostMapping
    public IncomeSource saveIncomeSource(@RequestBody IncomeSource incomeSource) {
        return incomeSourceRepository.save(incomeSource);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeSource> updateIncomeSource(
            @PathVariable Long id,
            @RequestBody IncomeSource updated) {
        Optional<IncomeSource> existing = incomeSourceRepository.findById(id);
        if (existing.isPresent()) {
            IncomeSource inc = existing.get();
            inc.setType(updated.getType());
            inc.setAmount(updated.getAmount());
            if (updated.getIsConfirmed() != null) {
                inc.setIsConfirmed(updated.getIsConfirmed());
            }
            return ResponseEntity.ok(incomeSourceRepository.save(inc));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public void deleteIncomeSource(@PathVariable Long id) {
        incomeSourceRepository.deleteById(id);
    }
}
