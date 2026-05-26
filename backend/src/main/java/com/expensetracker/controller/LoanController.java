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
