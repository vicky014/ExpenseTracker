package com.expensetracker.repository;

import com.expensetracker.model.IncomeSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncomeSourceRepository extends JpaRepository<IncomeSource, Long> {
    List<IncomeSource> findByUserId(Long userId);
}
