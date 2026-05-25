package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;
    private Double amount;
    private String category; // Food & Dining, Transport, Utilities, Health, Shopping, etc.
    private String note;
    private LocalDate date;
    private Boolean isRecurring = false;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean recurring) { isRecurring = recurring; }
}
