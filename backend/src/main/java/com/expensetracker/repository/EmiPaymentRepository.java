package com.expensetracker.repository;

import com.expensetracker.model.EmiPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmiPaymentRepository extends JpaRepository<EmiPayment, Long> {
    List<EmiPayment> findByLoanId(Long loanId);
    void deleteByLoanId(Long loanId);
}
