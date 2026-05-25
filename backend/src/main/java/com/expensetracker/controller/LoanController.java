package com.expensetracker.controller;

import com.expensetracker.model.EmiPayment;
import com.expensetracker.model.Loan;
import com.expensetracker.repository.EmiPaymentRepository;
import com.expensetracker.repository.LoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/loans")
public class LoanController {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private EmiPaymentRepository emiPaymentRepository;

    public static class LoanWithPayments {
        private Loan loan;
        private List<EmiPayment> payments;

        public LoanWithPayments(Loan loan, List<EmiPayment> payments) {
            this.loan = loan;
            this.payments = payments;
        }

        public Loan getLoan() { return loan; }
        public List<EmiPayment> getPayments() { return payments; }
    }

    @GetMapping
    public List<LoanWithPayments> getLoans(@RequestParam Long userId) {
        List<Loan> loans = loanRepository.findByUserId(userId);
        if (loans.isEmpty() && userId == 1L) {
            // Seed a default Car Loan and Friend Loan
            LocalDate today = LocalDate.now();
            
            Loan carLoan = new Loan();
            carLoan.setUserId(1L);
            carLoan.setName("HDFC Car Loan");
            carLoan.setPrincipal(600000.0);
            carLoan.setRate(9.5);
            carLoan.setTenure(36);
            carLoan.setEmi(19220.0);
            carLoan.setStartDate(today.minusMonths(6).withDayOfMonth(5)); // Started 6 months ago
            carLoan.setLender("HDFC Bank");
            carLoan.setType("Car");
            Loan savedCarLoan = loanRepository.save(carLoan);
            generatePaymentsForLoan(savedCarLoan, 6); // Pre-pay the first 6 payments for visual appeal!

            Loan fdLoan = new Loan();
            fdLoan.setUserId(1L);
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

            loans = loanRepository.findByUserId(1L);
        }

        List<LoanWithPayments> result = new ArrayList<>();
        for (Loan loan : loans) {
            List<EmiPayment> payments = emiPaymentRepository.findByLoanId(loan.getId());
            // Sort payments by due date
            payments.sort(Comparator.comparing(EmiPayment::getDueDate));
            result.add(new LoanWithPayments(loan, payments));
        }
        return result;
    }

    @PostMapping
    @Transactional
    public LoanWithPayments createLoan(@RequestBody Loan loan) {
        if (loan.getStartDate() == null) {
            loan.setStartDate(LocalDate.now());
        }
        
        // Simple EMI calculation if not provided
        if (loan.getEmi() == null || loan.getEmi() <= 0) {
            double p = loan.getPrincipal();
            double r = (loan.getRate() / 100.0) / 12.0;
            int n = loan.getTenure();
            if (r > 0) {
                double emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                loan.setEmi(Math.round(emi * 100.0) / 100.0);
            } else {
                loan.setEmi(Math.round((p / n) * 100.0) / 100.0);
            }
        }
        
        Loan savedLoan = loanRepository.save(loan);
        List<EmiPayment> payments = generatePaymentsForLoan(savedLoan, 0);
        return new LoanWithPayments(savedLoan, payments);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteLoan(@PathVariable Long id) {
        emiPaymentRepository.deleteByLoanId(id);
        loanRepository.deleteById(id);
    }

    @PostMapping("/{loanId}/payments/{paymentId}/toggle")
    public ResponseEntity<EmiPayment> togglePayment(
            @PathVariable Long loanId,
            @PathVariable Long paymentId,
            @RequestParam Boolean isPaid) {
        Optional<EmiPayment> paymentOpt = emiPaymentRepository.findById(paymentId);
        if (paymentOpt.isPresent()) {
            EmiPayment payment = paymentOpt.get();
            if (payment.getLoanId().equals(loanId)) {
                payment.setIsPaid(isPaid);
                payment.setPaidDate(isPaid ? LocalDate.now() : null);
                EmiPayment saved = emiPaymentRepository.save(payment);
                return ResponseEntity.ok(saved);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{loanId}/payments/{paymentId}")
    public ResponseEntity<EmiPayment> updatePaymentAmount(
            @PathVariable Long loanId,
            @PathVariable Long paymentId,
            @RequestParam Double amount) {
        Optional<EmiPayment> paymentOpt = emiPaymentRepository.findById(paymentId);
        if (paymentOpt.isPresent()) {
            EmiPayment payment = paymentOpt.get();
            if (payment.getLoanId().equals(loanId)) {
                payment.setAmount(amount);
                EmiPayment saved = emiPaymentRepository.save(payment);
                return ResponseEntity.ok(saved);
            }
        }
        return ResponseEntity.notFound().build();
    }

    private List<EmiPayment> generatePaymentsForLoan(Loan loan, int completedCount) {
        List<EmiPayment> payments = new ArrayList<>();
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
            payments.add(emiPaymentRepository.save(payment));
        }
        return payments;
    }
}
