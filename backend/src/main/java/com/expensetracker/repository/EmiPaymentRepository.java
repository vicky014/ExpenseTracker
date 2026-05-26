package com.expensetracker.repository;

import com.expensetracker.model.EmiPayment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmiPaymentRepository extends MongoRepository<EmiPayment, Long> {
    List<EmiPayment> findByLoanId(Long loanId);
    void deleteByLoanId(Long loanId);
}
