package com.expensetracker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Document(collection = "loans")
public class Loan {
    @Id
    private Long id;
    
    private Long userId;
    private String name;
    private Double principal;
    private Double rate; // interest rate p.a. in %
    private Integer tenure; // tenure in months
    private Double emi;
    private LocalDate startDate;
    private String lender;
    private String type; // Home, Car, Personal, Credit Card, Education, Friend, Other
    private String prepayPriority = "MEDIUM"; // HIGH, MEDIUM, LOW, EXCLUDE

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getPrincipal() { return principal; }
    public void setPrincipal(Double principal) { this.principal = principal; }
    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }
    public Integer getTenure() { return tenure; }
    public void setTenure(Integer tenure) { this.tenure = tenure; }
    public Double getEmi() { return emi; }
    public void setEmi(Double emi) { this.emi = emi; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public String getLender() { return lender; }
    public void setLender(String lender) { this.lender = lender; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getPrepayPriority() { return prepayPriority; }
    public void setPrepayPriority(String prepayPriority) { this.prepayPriority = prepayPriority; }
}
