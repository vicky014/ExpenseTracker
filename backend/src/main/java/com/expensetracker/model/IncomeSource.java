package com.expensetracker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "income_sources")
public class IncomeSource {
    @Id
    private Long id;
    
    private Long userId;
    private String type; // Salary, Freelance, Rental, Side Income, Returns, One-time
    private Double amount;
    private String frequency = "Monthly"; // Monthly, One-time
    private Boolean isConfirmed = true;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public Boolean getIsConfirmed() { return isConfirmed; }
    public void setIsConfirmed(Boolean confirmed) { isConfirmed = confirmed; }
}
