package com.expensetracker.controller;

import com.expensetracker.model.*;
import com.expensetracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private IncomeSourceRepository incomeSourceRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            // Seed a default user for local testing if looking for id 1
            if (id == 1L) {
                User defaultUser = new User();
                defaultUser.setId(1L);
                defaultUser.setName("Vikram");
                defaultUser.setEmail("vikram@expensetracker.local");
                defaultUser.setCurrency("₹");
                defaultUser.setSavingsGoal(15000.0);
                User saved = userRepository.save(defaultUser);

                // Centralized Seeding of all components for Demo User 1
                seedDemoDataForUser(1L);

                return ResponseEntity.ok(saved);
            }
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public User createOrUpdateUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    private void seedDemoDataForUser(Long userId) {
        LocalDate today = LocalDate.now();

        // 1. Seed Loans & EMI Payments
        Loan carLoan = new Loan();
        carLoan.setUserId(userId);
        carLoan.setName("HDFC Car Loan");
        carLoan.setPrincipal(600000.0);
        carLoan.setRate(9.5);
        carLoan.setTenure(36);
        carLoan.setEmi(19220.0);
        carLoan.setStartDate(today.minusMonths(6).withDayOfMonth(5)); // Started 6 months ago
        carLoan.setLender("HDFC Bank");
        carLoan.setType("Car");
        Loan savedCarLoan = loanRepository.save(carLoan);
        generatePaymentsForLoan(savedCarLoan, 6);

        Loan fdLoan = new Loan();
        fdLoan.setUserId(userId);
        fdLoan.setName("Friend Loan - Rahul");
        fdLoan.setPrincipal(50000.0);
        fdLoan.setRate(0.0);
        fdLoan.setTenure(10);
        fdLoan.setEmi(5000.0);
        fdLoan.setStartDate(today.minusMonths(2).withDayOfMonth(10));
        fdLoan.setLender("Rahul");
        fdLoan.setType("Friend");
        Loan savedFdLoan = loanRepository.save(fdLoan);
        generatePaymentsForLoan(savedFdLoan, 2);

        // 2. Seed Expenses
        Expense e1 = new Expense();
        e1.setUserId(userId);
        e1.setAmount(1200.0);
        e1.setCategory("Food & Dining");
        e1.setNote("Dinner with family");
        e1.setDate(today.minusDays(1));
        expenseRepository.save(e1);

        Expense e2 = new Expense();
        e2.setUserId(userId);
        e2.setAmount(3500.0);
        e2.setCategory("Shopping");
        e2.setNote("Bought jacket");
        e2.setDate(today.minusDays(2));
        expenseRepository.save(e2);

        Expense e3 = new Expense();
        e3.setUserId(userId);
        e3.setAmount(450.0);
        e3.setCategory("Transport");
        e3.setNote("Uber ride to office");
        e3.setDate(today);
        expenseRepository.save(e3);

        Expense e4 = new Expense();
        e4.setUserId(userId);
        e4.setAmount(2000.0);
        e4.setCategory("Utilities & Bills");
        e4.setNote("Electricity Bill");
        e4.setDate(today.minusDays(4));
        expenseRepository.save(e4);

        // 3. Seed Income Sources
        IncomeSource salary = new IncomeSource();
        salary.setUserId(userId);
        salary.setType("Salary");
        salary.setAmount(85000.0);
        salary.setFrequency("Monthly");
        salary.setIsConfirmed(true);
        incomeSourceRepository.save(salary);

        IncomeSource freelance = new IncomeSource();
        freelance.setUserId(userId);
        freelance.setType("Freelance");
        freelance.setAmount(15000.0);
        freelance.setFrequency("Monthly");
        freelance.setIsConfirmed(false);
        incomeSourceRepository.save(freelance);

        // 4. Seed Budgets
        Budget b1 = new Budget();
        b1.setUserId(userId);
        b1.setCategory("Food & Dining");
        b1.setMonthlyLimit(10000.0);
        budgetRepository.save(b1);

        Budget b2 = new Budget();
        b2.setUserId(userId);
        b2.setCategory("Shopping");
        b2.setMonthlyLimit(8000.0);
        budgetRepository.save(b2);

        Budget b3 = new Budget();
        b3.setUserId(userId);
        b3.setCategory("Utilities & Bills");
        b3.setMonthlyLimit(6000.0);
        budgetRepository.save(b3);

        Budget b4 = new Budget();
        b4.setUserId(userId);
        b4.setCategory("Transport");
        b4.setMonthlyLimit(5000.0);
        budgetRepository.save(b4);
    }

    private void generatePaymentsForLoan(Loan loan, int completedCount) {
        LocalDate startDate = loan.getStartDate();
        for (int i = 0; i < loan.getTenure(); i++) {
            EmiPayment payment = new EmiPayment();
            payment.setLoanId(loan.getId());
            payment.setDueDate(startDate.plusMonths(i));
            payment.setAmount(loan.getEmi());
            if (i < completedCount) {
                payment.setIsPaid(true);
                payment.setPaidDate(startDate.plusMonths(i).plusDays(2));
            } else {
                payment.setIsPaid(false);
            }
            emiPaymentRepository.save(payment);
        }
    }
}
