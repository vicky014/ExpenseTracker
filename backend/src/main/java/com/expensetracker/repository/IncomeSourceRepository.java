package com.expensetracker.repository;

import com.expensetracker.model.IncomeSource;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncomeSourceRepository extends MongoRepository<IncomeSource, Long> {
    List<IncomeSource> findByUserId(Long userId);
}
