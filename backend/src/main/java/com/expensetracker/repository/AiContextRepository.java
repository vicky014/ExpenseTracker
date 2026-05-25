package com.expensetracker.repository;

import com.expensetracker.model.AiContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiContextRepository extends JpaRepository<AiContext, Long> {
    List<AiContext> findByUserIdOrderByCreatedAtDesc(Long userId);
}
