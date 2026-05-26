package com.expensetracker.repository;

import com.expensetracker.model.AiContext;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiContextRepository extends MongoRepository<AiContext, Long> {
    List<AiContext> findByUserIdOrderByCreatedAtDesc(Long userId);
}
