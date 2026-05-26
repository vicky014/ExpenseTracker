package com.expensetracker.repository;

import com.expensetracker.model.Loan;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoanRepository extends MongoRepository<Loan, Long> {
    List<Loan> findByUserId(Long userId);
}
